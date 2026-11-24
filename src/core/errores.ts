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
