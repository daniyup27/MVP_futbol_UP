// src/infrastructure/adapters/ValidadorPartidoEnMemoria.ts
// Adaptador de IValidadorPartido que consulta entidades Partido en memoria.
// La decisión "¿está finalizado?" la toma la entidad, no el adaptador (FPI-III-08).
// Un partido inexistente se trata como no finalizado.
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';
import { Partido } from '../../core/dominio/Partido';

export class ValidadorPartidoEnMemoria implements IValidadorPartido {
  private readonly partidos = new Map<string, Partido>();

  constructor(partidos: Partido[] = []) {
    partidos.forEach((p) => this.partidos.set(p.id, p));
  }

  async estaFinalizado(idPartido: string): Promise<boolean> {
    return this.partidos.get(idPartido)?.estaFinalizado() ?? false;
  }
}
