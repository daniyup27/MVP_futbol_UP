// src/core/ServicioBienestar.ts
import { IRepositorioBienestar, EvaluacionAnonima } from './ports/IRepositorioBienestar';
import { IValidadorPartido } from './ports/IValidadorPartido';
import { IAnonimizador } from './ports/IAnonimizador';
import {
  DependenciaNoDisponibleError,
  ErrorDeNegocio,
  PartidoNoEncontradoError,
  PartidoNoFinalizadoError,
  RegistroConcurrenteError,
} from './errores';
import { EscalaBienestar } from './dominio/EscalaBienestar';
import { AutoevaluacionBienestar } from './dominio/AutoevaluacionBienestar';
import { RegistroEvaluacionPartido } from './dominio/RegistroEvaluacionPartido';

/**
 * Servicio de aplicación del caso de uso "registrar autoevaluación".
 * Contrato (FPI-III-06):
 *  - Precondiciones: escalas enteras 1..5 y partido finalizado.
 *  - Éxito: devuelve el id que asigna la persistencia; se guardó solo el hash.
 *  - Errores de negocio: DatosEvaluacionInvalidosError, PartidoNoFinalizadoError,
 *    EvaluacionYaRegistradaError (RF-03). Un reintento igual devuelve el id existente.
 *  - Error técnico: DependenciaNoDisponibleError (validador o persistencia).
 *  En ningún error se llega a persistir la evaluación.
 */
export class ServicioBienestar {
  constructor(
    private repositorio: IRepositorioBienestar,
    private validador: IValidadorPartido,
    private anonimizador: IAnonimizador
  ) {}

  async registrarEvaluacion(
    idEstudiante: string,
    idTorneo: string,
    idPartido: string,
    escalaFisica: number,
    escalaMental: number
  ): Promise<string> {
    // 1. Las escalas se validan en su objeto de valor (FPI-III-08); se crean antes de
    //    consultar dependencias para no gastar una llamada en datos inválidos.
    EscalaBienestar.crear(escalaFisica, 'escalaFisica');
    EscalaBienestar.crear(escalaMental, 'escalaMental');

    // 2. Regla de negocio: solo se evalúa partido finalizado
    const estadoPartido = await this.consultar('validador-partidos', () =>
      this.validador.consultarEstado(idPartido)
    );
    if (estadoPartido === 'NO_EXISTE') {
      throw new PartidoNoEncontradoError(idPartido); // H-02 (RD-01)
    }
    if (estadoPartido !== 'FINALIZADO') {
      throw new PartidoNoFinalizadoError(idPartido);
    }

    // 3. Regla crítica (Ley 1581): seudonimización antes de persistir (ADR-16).
    //    idTorneo se conserva en la firma por compatibilidad.
    void idTorneo;
    const idAnonimoHash = this.anonimizador.generarHash(idEstudiante);
    const nueva = AutoevaluacionBienestar.registrar({ idAnonimoHash, idPartido, escalaFisica, escalaMental });

    // 4. RF-03 (CR-03): el agregado decide si es nueva, un reintento o un duplicado distinto.
    //    5. Persistencia. Si otra petición guardó la misma clave entre la consulta y el INSERT
    //    (RegistroConcurrenteError, FPI-III-14), se vuelve a consultar y se aplica la misma regla.
    for (let intento = 1; ; intento++) {
      const existente = await this.consultar('persistencia', () =>
        this.repositorio.buscarPorEstudianteYPartido(idAnonimoHash, idPartido)
      );
      const registro = RegistroEvaluacionPartido.cargar(
        idAnonimoHash,
        idPartido,
        existente ? { id: existente.id, evaluacion: AutoevaluacionBienestar.reconstituir(existente.evaluacion) } : null
      );
      const resultado = registro.registrar(nueva);
      if (resultado.tipo === 'REINTENTO') return resultado.idExistente;

      const evaluacion: EvaluacionAnonima = resultado.evaluacion.aRegistro();
      try {
        return await this.consultar('persistencia', () => this.repositorio.guardarEvaluacion(evaluacion));
      } catch (error) {
        if (error instanceof RegistroConcurrenteError && intento < 2) continue;
        throw error;
      }
    }
  }

  // Un fallo de un puerto se informa como indisponibilidad, nunca como regla de negocio.
  private async consultar<T>(
    dependencia: 'validador-partidos' | 'persistencia',
    operacion: () => Promise<T>
  ): Promise<T> {
    try {
      return await operacion();
    } catch (error) {
      if (
        error instanceof ErrorDeNegocio ||
        error instanceof DependenciaNoDisponibleError ||
        error instanceof RegistroConcurrenteError
      ) {
        throw error;
      }
      throw new DependenciaNoDisponibleError(dependencia, error);
    }
  }
}
