// src/core/dominio/Partido.ts
// Entidad (FPI-III-08). Su identidad es idPartido y se conserva al cambiar de estado.
// El estado solo cambia mediante finalizar(): no hay setters públicos.
//
//   PROGRAMADO --finalizar(marcador)--> FINALIZADO
//   FINALIZADO --finalizar(...)-------> rechazo (TransicionInvalidaError)
//
// El diagrama de clases de Software II define estado, goles_local, goles_visitante,
// finalizarPartido(goles_local, goles_visitante) y estaFinalizado().
import { TransicionInvalidaError } from '../errores';
import { Marcador } from './Marcador';

export type EstadoPartido = 'PROGRAMADO' | 'FINALIZADO';

export class Partido {
  private _estado: EstadoPartido;
  private _marcador: Marcador | null;

  private constructor(readonly id: string, estado: EstadoPartido, marcador: Marcador | null) {
    this._estado = estado;
    this._marcador = marcador;
  }

  static programado(id: string): Partido {
    return new Partido(id, 'PROGRAMADO', null);
  }

  get estado(): EstadoPartido {
    return this._estado;
  }

  get marcador(): Marcador | null {
    return this._marcador;
  }

  finalizar(golesLocal: number, golesVisitante: number): void {
    if (this._estado !== 'PROGRAMADO') {
      throw new TransicionInvalidaError(this._estado, 'finalizar');
    }
    // El marcador se valida antes de tocar el estado: si es inválido, nada cambia.
    const marcador = Marcador.crear(golesLocal, golesVisitante);
    this._marcador = marcador;
    this._estado = 'FINALIZADO';
  }

  estaFinalizado(): boolean {
    return this._estado === 'FINALIZADO';
  }

  mismaIdentidad(otro: Partido): boolean {
    return this.id === otro.id;
  }
}
