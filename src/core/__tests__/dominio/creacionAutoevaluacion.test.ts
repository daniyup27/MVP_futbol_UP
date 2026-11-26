// src/core/__tests__/dominio/creacionAutoevaluacion.test.ts
// FPI-III-13 · Creación válida de AutoevaluacionBienestar con el dominio aislado
// (sin servidor HTTP ni base de datos). Ejecutar: npx jest src/core/__tests__/dominio
import { AutoevaluacionBienestar } from '../../dominio/AutoevaluacionBienestar';
import { InvarianteVioladaError } from '../../errores';

const HEX64 = 'ab'.repeat(32);
const base = { idAnonimoHash: HEX64, idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 };

describe('AutoevaluacionBienestar.registrar · construcción inválida', () => {
  it.each([
    ['seudónimo vacío', { idAnonimoHash: '' }],
    ['identificador en claro en lugar del seudónimo', { idAnonimoHash: '1090000000' }],
    ['seudónimo de 63 caracteres', { idAnonimoHash: HEX64.slice(1) }],
    ['seudónimo de 65 caracteres', { idAnonimoHash: HEX64 + 'a' }],
    ['seudónimo en mayúsculas', { idAnonimoHash: HEX64.toUpperCase() }],
    ['partido vacío', { idPartido: '   ' }],
    ['fecha inválida', { fechaRegistro: new Date('no-es-fecha') }],
  ])('rechaza %s con InvarianteVioladaError', (_caso, cambio) => {
    expect(() => AutoevaluacionBienestar.registrar({ ...base, ...cambio })).toThrow(InvarianteVioladaError);
  });

  it('una escala fuera de rango sigue siendo DATOS_INVALIDOS (error del usuario, no del sistema)', () => {
    expect(() => AutoevaluacionBienestar.registrar({ ...base, escalaFisica: 0 })).toThrow(
      expect.objectContaining({ codigo: 'DATOS_INVALIDOS' })
    );
  });
});

describe('AutoevaluacionBienestar.registrar · fronteras válidas', () => {
  it('acepta un seudónimo de exactamente 64 hex y escalas 1 y 5', () => {
    const a = AutoevaluacionBienestar.registrar({ ...base, escalaFisica: 1, escalaMental: 5 });
    expect(a.aRegistro()).toMatchObject({ idAnonimoHash: HEX64, escalaFisica: 1, escalaMental: 5 });
  });

  it('usa la fecha recibida, lo que permite probar con un reloj fijo', () => {
    const fecha = new Date('2026-11-25T20:00:00Z');
    expect(AutoevaluacionBienestar.registrar({ ...base, fechaRegistro: fecha }).fechaRegistro).toBe(fecha);
  });
});
