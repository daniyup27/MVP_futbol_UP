// src/core/validarCantidadJugadores.ts
/**
 * Valida la cantidad de jugadores de un equipo según la modalidad.
 *
 * Desde FPI-III-03 delega en la Strategy ReglasTorneo. La firma pública se
 * conserva para no afectar a los consumidores existentes; el parámetro
 * `reglas` permite inyectar un registro alternativo (p. ej. en pruebas).
 */
import { REGLAS_POR_TIPO, ReglasTorneo, TipoTorneo } from './torneos/reglasTorneo';

export type { TipoTorneo } from './torneos/reglasTorneo';

/** Límites derivados de la configuración (compatibilidad con el frontend). */
export const LIMITES_TORNEO: Record<string, { min: number; max: number }> = Object.fromEntries(
  Object.values(REGLAS_POR_TIPO).map((r) => [r.tipo, { min: r.minJugadores, max: r.maxJugadores }])
);

/**
 * @throws Error si el tipo de torneo es desconocido o la cantidad está fuera de rango.
 */
export function validarCantidadJugadores(
  cantidad: number,
  tipoTorneo: TipoTorneo | string,
  reglas: Readonly<Record<string, ReglasTorneo>> = REGLAS_POR_TIPO
): void {
  const estrategia = reglas[tipoTorneo];
  if (!estrategia) {
    throw new Error(`Tipo de torneo desconocido: ${tipoTorneo}`);
  }
  estrategia.validarCantidadJugadores(cantidad);
}
