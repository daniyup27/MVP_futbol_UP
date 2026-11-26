// src/core/dominio/Marcador.ts
// Objeto de valor (FPI-III-08): goles de local y visitante al finalizar un partido.
// Corresponde a los atributos goles_local y goles_visitante del diagrama de clases.
import { MarcadorInvalidoError } from '../errores';

export class Marcador {
  private constructor(readonly golesLocal: number, readonly golesVisitante: number) {
    Object.freeze(this);
  }

  static crear(golesLocal: number, golesVisitante: number): Marcador {
    for (const [nombre, goles] of [['golesLocal', golesLocal], ['golesVisitante', golesVisitante]] as const) {
      if (!Number.isInteger(goles) || goles < 0) {
        throw new MarcadorInvalidoError(`${nombre} debe ser un entero mayor o igual a 0`);
      }
    }
    return new Marcador(golesLocal, golesVisitante);
  }

  equals(otro: Marcador): boolean {
    return this.golesLocal === otro.golesLocal && this.golesVisitante === otro.golesVisitante;
  }
}
