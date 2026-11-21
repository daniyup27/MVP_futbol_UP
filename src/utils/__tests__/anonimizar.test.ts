// src/utils/__tests__/anonimizar.test.ts — ADR-16
import { generarHashAnonimo } from '../anonimizar';

describe('generarHashAnonimo (ADR-16)', () => {
  const saltOriginal = process.env.ANONIMIZATION_SALT;
  afterEach(() => {
    process.env.ANONIMIZATION_SALT = saltOriginal;
  });

  it('devuelve 64 caracteres hexadecimales sin contener el identificador', () => {
    const hash = generarHashAnonimo('1090000000');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain('1090000000');
  });

  it('falla si el secreto no está configurado (sin valor por defecto embebido)', () => {
    delete process.env.ANONIMIZATION_SALT;
    expect(() => generarHashAnonimo('1090000000')).toThrow('ANONIMIZATION_SALT');
  });

  it('cambia el hash si cambia el secreto', () => {
    const h1 = generarHashAnonimo('1090000000');
    process.env.ANONIMIZATION_SALT = 'otro-salt-sintetico-abcdefghijklmnopqrstuvwxyz';
    expect(generarHashAnonimo('1090000000')).not.toBe(h1);
  });
});
