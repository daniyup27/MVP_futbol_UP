// src/core/torneos/reglasTorneo.ts
/**
 * Strategy de reglas por modalidad de torneo (FPI-III-03).
 *
 * - Contrato: ReglasTorneo. Los consumidores solo conocen esta interfaz.
 * - Estrategia concreta por defecto: reglasPorRango, construida desde
 *   tournament.config (única fuente de verdad de los límites).
 * - Registro: REGLAS_POR_TIPO se arma recorriendo la configuración; agregar una
 *   modalidad en la configuración la registra sin modificar a los consumidores.
 */
import { TOURNAMENT_CONFIG } from '../../config/tournament.config';

export type TipoTorneo = keyof typeof TOURNAMENT_CONFIG;

export interface ReglasTorneo {
  readonly tipo: string;
  readonly minJugadores: number;
  readonly maxJugadores: number;
  /** @throws Error si la cantidad no cumple la regla de la modalidad. */
  validarCantidadJugadores(cantidad: number): void;
}

export function reglasPorRango(tipo: string, min: number, max: number): ReglasTorneo {
  return {
    tipo,
    minJugadores: min,
    maxJugadores: max,
    validarCantidadJugadores(cantidad: number): void {
      if (cantidad < min || cantidad > max) {
        throw new Error(`Torneo ${tipo} requiere entre ${min} y ${max} jugadores`);
      }
    },
  };
}

export const REGLAS_POR_TIPO: Readonly<Record<string, ReglasTorneo>> = Object.freeze(
  Object.fromEntries(
    Object.entries(TOURNAMENT_CONFIG).map(([tipo, cfg]) => [
      tipo,
      reglasPorRango(tipo, cfg.MIN_PLAYERS_TO_START, cfg.MAX_PLAYERS_PER_TEAM),
    ])
  )
);
