// src/core/__tests__/validarCantidadJugadores.test.ts
import { validarCantidadJugadores } from '../validarCantidadJugadores';

describe('validarCantidadJugadores', () => {
  it('debe aceptar 10 jugadores en torneo TRADITIONAL', () => {
    expect(() => validarCantidadJugadores(10, 'TRADITIONAL')).not.toThrow();
  });

  it('debe rechazar 6 jugadores en torneo TRADITIONAL (mínimo 7)', () => {
    expect(() => validarCantidadJugadores(6, 'TRADITIONAL')).toThrow(
      'Torneo TRADITIONAL requiere entre 7 y 15 jugadores'
    );
  });

  it('debe rechazar 16 jugadores en torneo TRADITIONAL (máximo 15)', () => {
    expect(() => validarCantidadJugadores(16, 'TRADITIONAL')).toThrow(
      'Torneo TRADITIONAL requiere entre 7 y 15 jugadores'
    );
  });

  it('debe aceptar 7 jugadores en torneo WELLBEING (mínimo flexible)', () => {
    expect(() => validarCantidadJugadores(7, 'WELLBEING')).not.toThrow();
  });

  it('debe rechazar 12 jugadores en torneo WELLBEING (máximo 11)', () => {
    expect(() => validarCantidadJugadores(12, 'WELLBEING')).toThrow(
      'Torneo WELLBEING requiere entre 5 y 11 jugadores'
    );
  });

  it('debe lanzar error con tipo de torneo desconocido', () => {
    expect(() => validarCantidadJugadores(5, 'FUTSAL')).toThrow(
      'Tipo de torneo desconocido: FUTSAL'
    );
  });
});
