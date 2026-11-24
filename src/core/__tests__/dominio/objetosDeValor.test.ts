// src/core/__tests__/dominio/objetosDeValor.test.ts
// FPI-III-08 · EscalaBienestar y Marcador se comparan por valor y son inmutables.
import { EscalaBienestar } from '../../dominio/EscalaBienestar';
import { Marcador } from '../../dominio/Marcador';
import { AutoevaluacionBienestar } from '../../dominio/AutoevaluacionBienestar';

describe('EscalaBienestar (objeto de valor)', () => {
  it.each([1, 5])('acepta el límite %i', (v) => {
    expect(EscalaBienestar.crear(v).valor).toBe(v);
  });

  it.each([0, 6, 3.5, NaN])('rechaza %p con DATOS_INVALIDOS', (v) => {
    expect(() => EscalaBienestar.crear(v)).toThrow(expect.objectContaining({ codigo: 'DATOS_INVALIDOS' }));
  });

  it('dos escalas con el mismo valor son iguales aunque sean objetos distintos', () => {
    const a = EscalaBienestar.crear(4);
    const b = EscalaBienestar.crear(4);
    expect(a).not.toBe(b);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(EscalaBienestar.crear(3))).toBe(false);
  });

  it('es inmutable', () => {
    const escala = EscalaBienestar.crear(2);
    expect(() => {
      (escala as unknown as { valor: number }).valor = 5;
    }).toThrow(TypeError);
    expect(escala.valor).toBe(2);
  });
});

describe('Marcador (objeto de valor)', () => {
  it('compara por goles', () => {
    expect(Marcador.crear(3, 2).equals(Marcador.crear(3, 2))).toBe(true);
    expect(Marcador.crear(3, 2).equals(Marcador.crear(2, 3))).toBe(false);
  });

  it('rechaza goles no enteros', () => {
    expect(() => Marcador.crear(1.5, 0)).toThrow(expect.objectContaining({ codigo: 'MARCADOR_INVALIDO' }));
  });
});

describe('AutoevaluacionBienestar (entidad)', () => {
  it('se construye con escalas válidas y entrega el registro plano sin idEstudiante', () => {
    const fecha = new Date('2026-11-24T15:00:00Z');
    const evaluacion = AutoevaluacionBienestar.registrar({
      idAnonimoHash: 'f'.repeat(64),
      idPartido: 'partido-7',
      escalaFisica: 4,
      escalaMental: 3,
      fechaRegistro: fecha,
    });
    expect(evaluacion.aRegistro()).toEqual({
      idAnonimoHash: 'f'.repeat(64),
      idPartido: 'partido-7',
      escalaFisica: 4,
      escalaMental: 3,
      fechaRegistro: fecha,
    });
    expect(evaluacion.aRegistro()).not.toHaveProperty('idEstudiante');
  });

  it('no se puede crear con una escala fuera de rango', () => {
    expect(() =>
      AutoevaluacionBienestar.registrar({ idAnonimoHash: 'f'.repeat(64), idPartido: 'p', escalaFisica: 6, escalaMental: 3 })
    ).toThrow(expect.objectContaining({ codigo: 'DATOS_INVALIDOS' }));
  });
});
