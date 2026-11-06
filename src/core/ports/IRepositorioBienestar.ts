// src/core/ports/IRepositorioBienestar.ts
export interface EvaluacionAnonima {
  idAnonimoHash: string; // UUID v4, NUNCA id_estudiante
  idPartido: string;
  escalaFisica: number;
  escalaMental: number;
  fechaRegistro: Date;
}

export interface IRepositorioBienestar {
  guardarEvaluacion(evaluacion: EvaluacionAnonima): Promise<string>;
}
