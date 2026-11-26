// src/core/dominio/RegistroEvaluacionPartido.ts
// Agregado (FPI-III-11). Raíz: el registro de UN estudiante (idAnonimoHash) en UN partido.
// Invariante RF-03 (CR-03): como máximo una autoevaluación dentro del límite.
//
//   SIN_EVALUACION --registrar(nueva)--------------------> EVALUADO (se guarda la nueva)
//   EVALUADO       --registrar(mismas respuestas)--------> EVALUADO (reintento: sin cambios)
//   EVALUADO       --registrar(respuestas distintas)-----> rechazo EvaluacionYaRegistradaError
//
// El límite es pequeño a propósito: no incluye al Partido ni a otros estudiantes. Que dos
// peticiones simultáneas no creen dos registros lo garantiza la restricción UNIQUE de la base
// (FPI-III-14); el agregado decide la regla con lo que ya está guardado.
import { EvaluacionYaRegistradaError } from '../errores';
import { AutoevaluacionBienestar } from './AutoevaluacionBienestar';

export type ResultadoRegistro =
  | { tipo: 'NUEVA'; evaluacion: AutoevaluacionBienestar }
  | { tipo: 'REINTENTO'; idExistente: string };

export class RegistroEvaluacionPartido {
  private constructor(
    readonly idAnonimoHash: string,
    readonly idPartido: string,
    private readonly existente: { id: string; evaluacion: AutoevaluacionBienestar } | null
  ) {}

  static cargar(
    idAnonimoHash: string,
    idPartido: string,
    existente: { id: string; evaluacion: AutoevaluacionBienestar } | null
  ): RegistroEvaluacionPartido {
    return new RegistroEvaluacionPartido(idAnonimoHash, idPartido, existente);
  }

  get estado(): 'SIN_EVALUACION' | 'EVALUADO' {
    return this.existente ? 'EVALUADO' : 'SIN_EVALUACION';
  }

  registrar(nueva: AutoevaluacionBienestar): ResultadoRegistro {
    if (nueva.idAnonimoHash !== this.idAnonimoHash || nueva.idPartido !== this.idPartido) {
      throw new Error('La autoevaluación no pertenece a este registro');
    }
    if (!this.existente) return { tipo: 'NUEVA', evaluacion: nueva };
    if (this.existente.evaluacion.mismasRespuestas(nueva)) {
      return { tipo: 'REINTENTO', idExistente: this.existente.id };
    }
    throw new EvaluacionYaRegistradaError(this.existente.id);
  }
}
