// src/infrastructure/adapters/ValidadorPartidoEnMemoria.ts
// Adaptador de IValidadorPartido que consulta entidades Partido en memoria.
// La decisión "¿está finalizado?" la toma la entidad, no el adaptador (FPI-III-08).
// FPI-III-12: un partido inexistente se informa como NO_EXISTE.
import { EstadoConsultaPartido, IValidadorPartido } from '../../core/ports/IValidadorPartido';
import { Partido } from '../../core/dominio/Partido';

export class ValidadorPartidoEnMemoria implements IValidadorPartido {
  private readonly partidos = new Map<string, Partido>();

  constructor(partidos: Partido[] = []) {
    partidos.forEach((p) => this.partidos.set(p.id, p));
  }

  async consultarEstado(idPartido: string): Promise<EstadoConsultaPartido> {
    const partido = this.partidos.get(idPartido);
    if (!partido) return 'NO_EXISTE';
    return partido.estaFinalizado() ? 'FINALIZADO' : 'PROGRAMADO';
  }
}
