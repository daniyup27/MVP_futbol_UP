// src/core/ServicioBienestar.ts
import { IRepositorioBienestar, EvaluacionAnonima } from './ports/IRepositorioBienestar';
import { IValidadorPartido } from './ports/IValidadorPartido';
import { generarHashAnonimo } from '../utils/anonimizar';

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
    // 1. Regla de negocio: solo se evalúa partido finalizado
    const partidoFinalizado = await this.validador.estaFinalizado(idPartido);
    if (!partidoFinalizado) {
      throw new Error('No se puede evaluar un partido no finalizado');
    }

    // 2. Regla de negocio crítica (Ley 1581): seudonimización antes de persistir.
    //    El hash depende solo del estudiante para permitir seguimiento entre
    //    torneos (ADR-16); idTorneo se conserva en la firma por compatibilidad.
    void idTorneo;
    const idAnonimoHash = generarHashAnonimo(idEstudiante);

    const evaluacion: EvaluacionAnonima = {
      idAnonimoHash,
      idPartido,
      escalaFisica,
      escalaMental,
      fechaRegistro: new Date(),
    };

    // 3. Delegar la persistencia al adaptador (Inversión de Dependencias)
    return await this.repositorio.guardarEvaluacion(evaluacion);
  }
}
