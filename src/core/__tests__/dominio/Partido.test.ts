// src/core/__tests__/dominio/Partido.test.ts
// FPI-III-08 · Transición aceptada, transición inválida y casos de frontera.
import { Partido } from '../../dominio/Partido';
import { Marcador } from '../../dominio/Marcador';
import { MarcadorInvalidoError, TransicionInvalidaError } from '../../errores';

describe('Partido (entidad)', () => {
  it('transición aceptada: PROGRAMADO → FINALIZADO con finalizar(2, 1)', () => {
    const partido = Partido.programado('partido-7');

    partido.finalizar(2, 1);

    expect(partido.estado).toBe('FINALIZADO');
    expect(partido.estaFinalizado()).toBe(true);
    expect(partido.marcador?.equals(Marcador.crear(2, 1))).toBe(true);
    expect(partido.id).toBe('partido-7'); // la identidad sobrevive al cambio de estado
  });

  it('transición inválida: finalizar un partido FINALIZADO se rechaza y no cambia el marcador', () => {
    const partido = Partido.programado('partido-7');
    partido.finalizar(2, 1);

    expect(() => partido.finalizar(0, 0)).toThrow(TransicionInvalidaError);
    expect(partido.estado).toBe('FINALIZADO');
    expect(partido.marcador?.equals(Marcador.crear(2, 1))).toBe(true);
  });

  it('frontera: 0-0 es un marcador válido y finaliza el partido', () => {
    const partido = Partido.programado('partido-8');
    partido.finalizar(0, 0);
    expect(partido.estado).toBe('FINALIZADO');
    expect(partido.marcador).toMatchObject({ golesLocal: 0, golesVisitante: 0 });
  });

  it('frontera: -1 goles se rechaza y el partido sigue PROGRAMADO sin marcador', () => {
    const partido = Partido.programado('partido-9');
    expect(() => partido.finalizar(-1, 0)).toThrow(MarcadorInvalidoError);
    expect(partido.estado).toBe('PROGRAMADO');
    expect(partido.marcador).toBeNull();
  });

  it('no expone setters: el estado no se puede asignar desde fuera', () => {
    const partido = Partido.programado('partido-10');
    expect(() => {
      (partido as unknown as { estado: string }).estado = 'FINALIZADO';
    }).toThrow(TypeError);
    expect(partido.estado).toBe('PROGRAMADO');
  });

  it('dos objetos con el mismo id son el mismo partido aunque su estado difiera', () => {
    const a = Partido.programado('partido-11');
    const b = Partido.programado('partido-11');
    b.finalizar(1, 1);
    expect(a.mismaIdentidad(b)).toBe(true);
  });
});
