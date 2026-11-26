// src/core/ports/IConsultaEvaluaciones.ts
// Puerto de lectura, separado del de escritura (FPI-III-09, segregación de interfaces).
// ServicioBienestar solo necesita guardar; la consulta la usarán reportes y las
// pruebas de contrato, sin obligar al caso de uso a conocerla.
import { EvaluacionAnonima } from './IRepositorioBienestar';

export interface IConsultaEvaluaciones {
  buscarPorId(id: string): Promise<EvaluacionAnonima | null>;
}
