// src/core/validarCantidadJugadores.ts
export type TipoTorneo = 'TRADITIONAL' | 'WELLBEING';

const LIMITES: Record<TipoTorneo, { min: number; max: number }> = {
  TRADITIONAL: { min: 7, max: 15 },
  WELLBEING: { min: 5, max: 11 },
};

export function validarCantidadJugadores(
  cantidad: number,
  tipoTorneo: TipoTorneo
): void {
  const limites = LIMITES[tipoTorneo];
  if (!limites) {
    throw new Error(`Tipo de torneo desconocido: ${tipoTorneo}`);
  }

  if (cantidad < limites.min || cantidad > limites.max) {
    throw new Error(
      `Torneo ${tipoTorneo} requiere entre ${limites.min} y ${limites.max} jugadores`
    );
  }
}
