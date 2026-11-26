// src/core/bienestar/registrarEvaluacionScript.ts
// FPI-III-12 · Versión Transaction Script de "registrar autoevaluación".
// Experimento acotado: mismo contrato y mismos puertos que ServicioBienestar (Domain Model),
// pero toda la lógica vive en un solo procedimiento, sin entidades ni objetos de valor.
// No se usa en producción; existe para comparar ambos diseños con las mismas pruebas.
import { IAnonimizador } from '../ports/IAnonimizador';
import { IRepositorioBienestar } from '../ports/IRepositorioBienestar';
import { IValidadorPartido } from '../ports/IValidadorPartido';
import {
  DatosEvaluacionInvalidosError,
  DependenciaNoDisponibleError,
  ErrorDeNegocio,
  EvaluacionYaRegistradaError,
  PartidoNoFinalizadoError,
} from '../errores';

export interface DependenciasScript {
  repositorio: IRepositorioBienestar;
  validador: IValidadorPartido;
  anonimizador: IAnonimizador;
}

export async function registrarEvaluacionScript(
  deps: DependenciasScript,
  idEstudiante: string,
  idPartido: string,
  escalaFisica: number,
  escalaMental: number
): Promise<string> {
  // Regla 1: escalas enteras de 1 a 5
  for (const [nombre, valor] of [['escalaFisica', escalaFisica], ['escalaMental', escalaMental]] as const) {
    if (!Number.isInteger(valor) || valor < 1 || valor > 5) {
      throw new DatosEvaluacionInvalidosError(`${nombre} debe ser un entero entre 1 y 5`);
    }
  }

  // Regla 2: solo partidos finalizados
  let finalizado: boolean;
  try {
    finalizado = await deps.validador.estaFinalizado(idPartido);
  } catch (error) {
    throw new DependenciaNoDisponibleError('validador-partidos', error);
  }
  if (!finalizado) throw new PartidoNoFinalizadoError(idPartido);

  // Regla 3: seudonimización (ADR-16)
  const idAnonimoHash = deps.anonimizador.generarHash(idEstudiante);

  try {
    // Regla 4: una autoevaluación por estudiante y partido (RF-03)
    const existente = await deps.repositorio.buscarPorEstudianteYPartido(idAnonimoHash, idPartido);
    if (existente) {
      const mismas =
        existente.evaluacion.escalaFisica === escalaFisica && existente.evaluacion.escalaMental === escalaMental;
      if (mismas) return existente.id;
      throw new EvaluacionYaRegistradaError(existente.id);
    }

    // Escritura
    return await deps.repositorio.guardarEvaluacion({
      idAnonimoHash,
      idPartido,
      escalaFisica,
      escalaMental,
      fechaRegistro: new Date(),
    });
  } catch (error) {
    if (error instanceof ErrorDeNegocio || error instanceof DependenciaNoDisponibleError) throw error;
    throw new DependenciaNoDisponibleError('persistencia', error);
  }
}
