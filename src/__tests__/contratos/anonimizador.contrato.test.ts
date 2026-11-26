// src/__tests__/contratos/anonimizador.contrato.test.ts
// FPI-III-07 · Las mismas expectativas se ejecutan sobre las dos implementaciones del puerto.
// Ejecutar: npx jest src/__tests__/contratos --verbose
import { randomUUID } from 'crypto';
import { IAnonimizador } from '../../core/ports/IAnonimizador';
import { AnonimizadorHmac } from '../../infrastructure/seguridad/AnonimizadorHmac';
import { generarHashAnonimo } from '../../utils/anonimizar';
import { AnonimizadorDePrueba } from '../dobles/AnonimizadorDePrueba';
import { incumplimientosDelContrato } from './contratoAnonimizador';

describe.each<[string, () => IAnonimizador]>([
  ['AnonimizadorHmac (producción)', () => AnonimizadorHmac.desdeEntorno()],
  ['AnonimizadorDePrueba (doble)', () => new AnonimizadorDePrueba()],
])('Contrato IAnonimizador · %s', (_nombre, crear) => {
  it('cumple las cinco condiciones del contrato', () => {
    expect(incumplimientosDelContrato(crear())).toEqual([]);
  });
});

describe('AnonimizadorHmac', () => {
  const saltOriginal = process.env.ANONIMIZATION_SALT;
  afterEach(() => {
    process.env.ANONIMIZATION_SALT = saltOriginal;
  });

  it('produce exactamente el mismo hash que generarHashAnonimo (comportamiento conservado)', () => {
    expect(AnonimizadorHmac.desdeEntorno().generarHash('1090000000')).toBe(generarHashAnonimo('1090000000'));
  });

  it('falla al construirse si falta el secreto, antes de atender peticiones', () => {
    delete process.env.ANONIMIZATION_SALT;
    expect(() => AnonimizadorHmac.desdeEntorno()).toThrow('ANONIMIZATION_SALT');
  });
});

describe('Controles negativos: dobles que NO son sustitutos válidos', () => {
  it('un doble que devuelve siempre el mismo valor rompe "distinto por estudiante"', () => {
    const constante: IAnonimizador = { generarHash: () => 'a'.repeat(64) };
    expect(incumplimientosDelContrato(constante)).toEqual(
      expect.arrayContaining(['distinto por estudiante', 'rechaza identificador vacío'])
    );
  });

  it('un UUID v4 aleatorio rompe "determinista" y el formato (decisión previa a ADR-16)', () => {
    const uuid: IAnonimizador = { generarHash: () => randomUUID() };
    expect(incumplimientosDelContrato(uuid)).toEqual(
      expect.arrayContaining(['determinista', 'formato 64 hex'])
    );
  });
});
