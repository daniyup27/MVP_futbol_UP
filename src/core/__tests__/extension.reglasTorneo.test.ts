// src/core/__tests__/extension.reglasTorneo.test.ts
/**
 * FPI-III-03 · Prueba de extensión: una modalidad nueva se integra sin
 * modificar al consumidor (validarCantidadJugadores).
 */
import { validarCantidadJugadores } from '../validarCantidadJugadores';
import { REGLAS_POR_TIPO, ReglasTorneo } from '../torneos/reglasTorneo';

describe('Extensión de ReglasTorneo', () => {
  it('FUTSAL queda registrada solo con configuración (5 a 12 jugadores)', () => {
    expect(() => validarCantidadJugadores(5, 'FUTSAL')).not.toThrow();
    expect(() => validarCantidadJugadores(12, 'FUTSAL')).not.toThrow();
    expect(() => validarCantidadJugadores(13, 'FUTSAL')).toThrow(
      'Torneo FUTSAL requiere entre 5 y 12 jugadores'
    );
  });

  it('acepta una estrategia con comportamiento propio inyectada por el llamador', () => {
    // Estrategia de prueba: solo admite plantillas de número par
    const reglaPar: ReglasTorneo = {
      tipo: 'PRUEBA_PAR', minJugadores: 2, maxJugadores: 20,
      validarCantidadJugadores(n: number) {
        if (n % 2 !== 0) throw new Error('PRUEBA_PAR exige plantilla par');
      },
    };
    const registro = { ...REGLAS_POR_TIPO, PRUEBA_PAR: reglaPar };

    expect(() => validarCantidadJugadores(8, 'PRUEBA_PAR', registro)).not.toThrow();
    expect(() => validarCantidadJugadores(7, 'PRUEBA_PAR', registro)).toThrow('plantilla par');
  });
});
