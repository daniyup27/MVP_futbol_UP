// src/core/ports/IRepositorioBienestar.ts
export interface EvaluacionAnonima {
  idAnonimoHash: string; // seudónimo HMAC-SHA256 de 64 hex (ADR-16); NUNCA el id del estudiante
  idPartido: string;
  escalaFisica: number;
  escalaMental: number;
  fechaRegistro: Date;
}

export interface EvaluacionRegistrada {
  id: string;
  evaluacion: EvaluacionAnonima;
}

export interface IRepositorioBienestar {
  guardarEvaluacion(evaluacion: EvaluacionAnonima): Promise<string>;
  /** FPI-III-11 (CR-03): la evaluación de un estudiante en un partido, si existe. */
  buscarPorEstudianteYPartido(idAnonimoHash: string, idPartido: string): Promise<EvaluacionRegistrada | null>;
}
