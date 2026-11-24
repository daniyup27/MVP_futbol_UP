// src/core/ServicioBienestar.ts
import { IRepositorioBienestar, EvaluacionAnonima } from './ports/IRepositorioBienestar';
import { IValidadorPartido } from './ports/IValidadorPartido';
import { generarHashAnonimo } from '../utils/anonimizar';
import {
  DatosEvaluacionInvalidosError,
  DependenciaNoDisponibleError,
  ErrorDeNegocio,
  PartidoNoFinalizadoError,
} from './errores';

export const ESCALA_MINIMA = 1;
export const ESCALA_MAXIMA = 5;

function validarEscala(nombre: string, valor: number): void {
  if (!Number.isInteger(valor) || valor < ESCALA_MINIMA || valor > ESCALA_MAXIMA) {
    throw new DatosEvaluacionInvalidosError(
      `${nombre} debe ser un entero entre ${ESCALA_MINIMA} y ${ESCALA_MAXIMA}`
    );
  }
}

/**
 * Servicio de aplicación del caso de uso "registrar autoevaluación".
 * Contrato (FPI-III-06):
 *  - Precondiciones: escalas enteras 1..5 y partido finalizado.
 *  - Éxito: devuelve el id que asigna la persistencia; se guardó solo el hash.
 *  - Errores de negocio: DatosEvaluacionInvalidosError, PartidoNoFinalizadoError.
 *  - Error técnico: DependenciaNoDisponibleError (validador o persistencia).
 *  En ningún error se llega a persistir la evaluación.
 */
export class ServicioBienestar {
  constructor(
    private repositorio: IRepositorioBienestar,
    private validador: IValidadorPartido
  ) {}

  async registrarEvaluacion(
    idEstudiante: string,
    idTorneo: string,
    idPartido: string,
    escalaFisica: number,
    escalaMental: number
  ): Promise<string> {
    // 1. Reglas que el servicio puede comprobar con los datos recibidos
    validarEscala('escalaFisica', escalaFisica);
    validarEscala('escalaMental', escalaMental);

    // 2. Regla de negocio: solo se evalúa partido finalizado
    const partidoFinalizado = await this.consultar('validador-partidos', () =>
      this.validador.estaFinalizado(idPartido)
    );
    if (!partidoFinalizado) {
      throw new PartidoNoFinalizadoError(idPartido);
    }

    // 3. Regla crítica (Ley 1581): seudonimización antes de persistir (ADR-16).
    //    idTorneo se conserva en la firma por compatibilidad.
    void idTorneo;
    const evaluacion: EvaluacionAnonima = {
      idAnonimoHash: generarHashAnonimo(idEstudiante),
      idPartido,
      escalaFisica,
      escalaMental,
      fechaRegistro: new Date(),
    };

    // 4. Delegar la persistencia al adaptador (Inversión de Dependencias)
    return this.consultar('persistencia', () => this.repositorio.guardarEvaluacion(evaluacion));
  }

  // Un fallo de un puerto se informa como indisponibilidad, nunca como regla de negocio.
  private async consultar<T>(
    dependencia: 'validador-partidos' | 'persistencia',
    operacion: () => Promise<T>
  ): Promise<T> {
    try {
      return await operacion();
    } catch (error) {
      if (error instanceof ErrorDeNegocio || error instanceof DependenciaNoDisponibleError) throw error;
      throw new DependenciaNoDisponibleError(dependencia, error);
    }
  }
}
