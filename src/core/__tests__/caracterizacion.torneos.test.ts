// src/core/__tests__/caracterizacion.torneos.test.ts
/**
 * FPI-III-03 · Pruebas de caracterización.
 * Fijan el comportamiento observable ANTES de introducir Strategy:
 * límites inclusivos por modalidad, mensaje de error y coherencia con
 * tournament.config (hoy los límites están escritos en dos lugares).
 */
import { validarCantidadJugadores, LIMITES_TORNEO } from '../validarCantidadJugadores';
import { TOURNAMENT_CONFIG } from '../../config/tournament.config';

describe('Caracterización de reglas de torneo', () => {
  it.each([
    ['TRADITIONAL', 7], ['TRADITIONAL', 15],
    ['WELLBEING', 5], ['WELLBEING', 11],
  ] as const)('acepta el límite inclusivo %s con %i jugadores', (tipo, n) => {
    expect(() => validarCantidadJugadores(n, tipo)).not.toThrow();
  });

  it.each([
    ['TRADITIONAL', 6, 'Torneo TRADITIONAL requiere entre 7 y 15 jugadores'],
    ['WELLBEING', 4, 'Torneo WELLBEING requiere entre 5 y 11 jugadores'],
  ] as const)('rechaza %s con %i jugadores y conserva el mensaje', (tipo, n, msg) => {
    expect(() => validarCantidadJugadores(n, tipo)).toThrow(msg);
  });

  it('los límites del validador coinciden con tournament.config', () => {
    expect(LIMITES_TORNEO.TRADITIONAL).toEqual({
      min: TOURNAMENT_CONFIG.TRADITIONAL.MIN_PLAYERS_TO_START,
      max: TOURNAMENT_CONFIG.TRADITIONAL.MAX_PLAYERS_PER_TEAM,
    });
    expect(LIMITES_TORNEO.WELLBEING).toEqual({
      min: TOURNAMENT_CONFIG.WELLBEING.MIN_PLAYERS_TO_START,
      max: TOURNAMENT_CONFIG.WELLBEING.MAX_PLAYERS_PER_TEAM,
    });
  });
});
