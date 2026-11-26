// src/core/__tests__/dominio/RegistroEvaluacionPartido.test.ts
// FPI-III-11 · CP-03 en el dominio: transición, límite (reintento) e intento inválido.
import { AutoevaluacionBienestar } from '../../dominio/AutoevaluacionBienestar';
import { RegistroEvaluacionPartido } from '../../dominio/RegistroEvaluacionPartido';
import { EvaluacionYaRegistradaError } from '../../errores';

const HASH_A = 'a1'.repeat(32);
const HASH_B = 'b2'.repeat(32);
const evaluacion = (hash: string, ef: number, em: number, idPartido = 'partido-7') =>
  AutoevaluacionBienestar.registrar({ idAnonimoHash: hash, idPartido, escalaFisica: ef, escalaMental: em });

describe('RegistroEvaluacionPartido (agregado, RF-03)', () => {
  it('transición: SIN_EVALUACION → la primera autoevaluación se acepta como NUEVA', () => {
    const registro = RegistroEvaluacionPartido.cargar(HASH_A, 'partido-7', null);
    expect(registro.estado).toBe('SIN_EVALUACION');
    const resultado = registro.registrar(evaluacion(HASH_A, 4, 3));
    expect(resultado.tipo).toBe('NUEVA');
  });

  it('límite: con las mismas escalas es un reintento y devuelve el id existente', () => {
    const registro = RegistroEvaluacionPartido.cargar(HASH_A, 'partido-7', { id: 'mem-1', evaluacion: evaluacion(HASH_A, 4, 3) });
    expect(registro.estado).toBe('EVALUADO');
    expect(registro.registrar(evaluacion(HASH_A, 4, 3))).toEqual({ tipo: 'REINTENTO', idExistente: 'mem-1' });
  });

  it('inválido: con una sola escala distinta se rechaza y no se reemplaza la primera', () => {
    const primera = evaluacion(HASH_A, 4, 3);
    const registro = RegistroEvaluacionPartido.cargar(HASH_A, 'partido-7', { id: 'mem-1', evaluacion: primera });
    expect(() => registro.registrar(evaluacion(HASH_A, 4, 2))).toThrow(EvaluacionYaRegistradaError);
    expect(registro.estado).toBe('EVALUADO');
    // la siguiente comparación sigue usando la primera evaluación
    expect(registro.registrar(evaluacion(HASH_A, 4, 3))).toEqual({ tipo: 'REINTENTO', idExistente: 'mem-1' });
  });

  it('el límite es por estudiante y partido: otra clave no puede pasar por esta raíz', () => {
    const registro = RegistroEvaluacionPartido.cargar(HASH_A, 'partido-7', null);
    expect(() => registro.registrar(evaluacion(HASH_B, 4, 3))).toThrow('no pertenece');
    expect(() => registro.registrar(evaluacion(HASH_A, 4, 3, 'partido-8'))).toThrow('no pertenece');
  });

  it('no se puede cambiar el estado desde fuera de la raíz', () => {
    const registro = RegistroEvaluacionPartido.cargar(HASH_A, 'partido-7', null);
    expect(() => {
      (registro as unknown as { estado: string }).estado = 'EVALUADO';
    }).toThrow(TypeError);
    expect(registro.estado).toBe('SIN_EVALUACION');
  });

  it('mismasRespuestas compara las escalas como objetos de valor', () => {
    expect(evaluacion(HASH_A, 4, 3).mismasRespuestas(evaluacion(HASH_B, 4, 3))).toBe(true);
    expect(evaluacion(HASH_A, 4, 3).mismasRespuestas(evaluacion(HASH_A, 3, 4))).toBe(false);
  });
});
