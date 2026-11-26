// src/core/errores.ts
// Errores tipados del caso de uso "registrar evaluación" (FPI-III-06).
// Los de negocio describen una regla incumplida; el técnico describe que una
// dependencia no respondió. La presentación decide el código HTTP según el tipo,
// así un fallo de conexión nunca se confunde con un rechazo de negocio.

export abstract class ErrorDeNegocio extends Error {
  abstract readonly codigo: string;
  readonly tipo = 'negocio' as const;
  constructor(mensaje: string) {
    super(mensaje);
    // Sin tsconfig, ts-jest compila a un target que rompe instanceof con Error.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PartidoNoFinalizadoError extends ErrorDeNegocio {
  readonly codigo = 'PARTIDO_NO_FINALIZADO';
  constructor(readonly idPartido: string) {
    super('No se puede evaluar un partido no finalizado');
    this.name = 'PartidoNoFinalizadoError';
  }
}

export class DatosEvaluacionInvalidosError extends ErrorDeNegocio {
  readonly codigo = 'DATOS_INVALIDOS';
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'DatosEvaluacionInvalidosError';
  }
}

export type DependenciaExterna = 'validador-partidos' | 'persistencia';

export class DependenciaNoDisponibleError extends Error {
  readonly codigo = 'DEPENDENCIA_NO_DISPONIBLE';
  readonly tipo = 'tecnico' as const;
  constructor(readonly dependencia: DependenciaExterna, readonly causa: unknown) {
    super(`Dependencia no disponible: ${dependencia}`);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'DependenciaNoDisponibleError';
  }
}

export class TransicionInvalidaError extends ErrorDeNegocio {
  readonly codigo = 'TRANSICION_INVALIDA';
  constructor(readonly desde: string, readonly operacion: string) {
    super(`No se puede ${operacion} un partido en estado ${desde}`);
    this.name = 'TransicionInvalidaError';
  }
}

export class MarcadorInvalidoError extends ErrorDeNegocio {
  readonly codigo = 'MARCADOR_INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'MarcadorInvalidoError';
  }
}

export class EvaluacionYaRegistradaError extends ErrorDeNegocio {
  readonly codigo = 'EVALUACION_YA_REGISTRADA';
  constructor(readonly idExistente: string) {
    super('Ya registraste una autoevaluación distinta para este partido');
    this.name = 'EvaluacionYaRegistradaError';
  }
}

export class PartidoNoEncontradoError extends ErrorDeNegocio {
  readonly codigo = 'PARTIDO_NO_ENCONTRADO';
  constructor(readonly idPartido: string) {
    super('El partido indicado no existe');
    this.name = 'PartidoNoEncontradoError';
  }
}

/**
 * FPI-III-13 · Invariante de creación violada por el propio sistema (no por el usuario):
 * por ejemplo, un seudónimo que no tiene el formato de ADR-16. No es ErrorDeNegocio,
 * así que la presentación lo trata como error interno (500) y nunca se persiste nada.
 */
export class InvarianteVioladaError extends Error {
  readonly codigo = 'INVARIANTE_VIOLADA';
  constructor(mensaje: string) {
    super(mensaje);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'InvarianteVioladaError';
  }
}

/**
 * FPI-III-14 · La base rechazó la escritura por la restricción de unicidad (RF-03) porque otra
 * petición del mismo estudiante y partido se guardó entre la consulta y el INSERT. No es un
 * error para el usuario: el servicio vuelve a consultar y aplica la regla del agregado.
 */
export class RegistroConcurrenteError extends Error {
  readonly codigo = 'REGISTRO_CONCURRENTE';
  constructor() {
    super('Otra petición registró la misma autoevaluación al mismo tiempo');
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = 'RegistroConcurrenteError';
  }
}
