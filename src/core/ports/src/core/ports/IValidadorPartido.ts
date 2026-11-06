// src/core/validarCantidadJugadores.ts
/**
 * Valida que la cantidad de jugadores de un equipo cumpla los límites
 * establecidos según el tipo de torneo.
 * 
 * Reglas de negocio (FPI-09):
 * - TRADITIONAL: entre 7 y 15 jugadores (reglamento universitario estándar)
 * - WELLBEING: entre 5 y 11 jugadores (reglas flexibles para participación masiva)
 */

export type TipoTorneo = 'TRADITIONAL' | 'WELLBEING';

/**
 * Límites de jugadores por tipo de torneo.
 * Exportado para que el frontend pueda mostrar los límites al usuario
 * sin duplicar la lógica de validación.
 */
export const LIMITES_TORNEO: Record<TipoTorneo, { min: number; max: number }> = {
  TRADITIONAL: { min: 7, max: 15 },
  WELLBEING: { min: 5, max: 11 },
};

/**
 * Valida la cantidad de jugadores de un equipo según el tipo de torneo.
 * @throws Error si el tipo de torneo es desconocido o la cantidad está fuera de rango.
 */
export function validarCantidadJugadores(
  cantidad: number,
  tipoTorneo: TipoTorneo
): void {
  const limites = LIMITES_TORNEO[tipoTorneo];
  
  if (!limites) {
    throw new Error(`Tipo de torneo desconocido: ${tipoTorneo}`);
  }

  if (cantidad < limites.min || cantidad > limites.max) {
    throw new Error(
      `Torneo ${tipoTorneo} requiere entre ${limites.min} y ${limites.max} jugadores`
    );
  }
}
