// src/__tests__/integration/dependencia-no-disponible.test.ts
/**
 * FPI-III-02 · Comprobación de enlaces con dependencia no disponible.
 *
 * Simula, en el entorno de pruebas, que el adaptador de persistencia no puede
 * conectarse a PostgreSQL (ECONNREFUSED) y que el validador de partidos no
 * responde. Se verifica que el fallo se propaga por el adaptador y que el
 * servicio NO confirma la evaluación. No toca ninguna base real.
 */
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';

const errorConexion = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), {
  code: 'ECONNREFUSED',
});

describe('Enlace dominio → persistencia con base no disponible', () => {
  const validadorOk: IValidadorPartido = { estaFinalizado: async () => true };

  it('propaga el error del adaptador y no devuelve id de evaluación', async () => {
    const repositorioCaido: IRepositorioBienestar = {
      guardarEvaluacion: jest.fn().mockRejectedValue(errorConexion),
    };
    const servicio = new ServicioBienestar(repositorioCaido, validadorOk);

    await expect(
      servicio.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-1', 4, 3)
    ).rejects.toMatchObject({ code: 'ECONNREFUSED' });
    expect(repositorioCaido.guardarEvaluacion).toHaveBeenCalledTimes(1);
  });

  it('no intenta persistir si el validador de partidos no responde', async () => {
    const repositorio: IRepositorioBienestar = { guardarEvaluacion: jest.fn() };
    const validadorCaido: IValidadorPartido = {
      estaFinalizado: jest.fn().mockRejectedValue(new Error('timeout validador')),
    };
    const servicio = new ServicioBienestar(repositorio, validadorCaido);

    await expect(
      servicio.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-1', 4, 3)
    ).rejects.toThrow('timeout validador');
    expect(repositorio.guardarEvaluacion).not.toHaveBeenCalled();
  });
});
