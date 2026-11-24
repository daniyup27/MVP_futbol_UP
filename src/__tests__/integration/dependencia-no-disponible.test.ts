// src/__tests__/integration/dependencia-no-disponible.test.ts
/**
 * FPI-III-02 · Comprobación de enlaces con dependencia no disponible.
 *
 * Simula, en el entorno de pruebas, que el adaptador de persistencia no puede
 * conectarse a PostgreSQL (ECONNREFUSED) y que el validador de partidos no
 * responde. Se verifica que el fallo se propaga por el adaptador y que el
 * servicio NO confirma la evaluación. No toca ninguna base real.
 *
 * FPI-III-06: desde el contrato del servicio, el fallo llega como
 * DependenciaNoDisponibleError (error técnico) y conserva la causa original.
 */
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';
import { DependenciaNoDisponibleError } from '../../core/errores';

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

    const error = await servicio
      .registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-1', 4, 3)
      .catch((e) => e);
    expect(error).toBeInstanceOf(DependenciaNoDisponibleError);
    expect(error).toMatchObject({ dependencia: 'persistencia', causa: { code: 'ECONNREFUSED' } });
    expect(repositorioCaido.guardarEvaluacion).toHaveBeenCalledTimes(1);
  });

  it('no intenta persistir si el validador de partidos no responde', async () => {
    const repositorio: IRepositorioBienestar = { guardarEvaluacion: jest.fn() };
    const validadorCaido: IValidadorPartido = {
      estaFinalizado: jest.fn().mockRejectedValue(new Error('timeout validador')),
    };
    const servicio = new ServicioBienestar(repositorio, validadorCaido);

    const error = await servicio
      .registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-1', 4, 3)
      .catch((e) => e);
    expect(error).toBeInstanceOf(DependenciaNoDisponibleError);
    expect(error.dependencia).toBe('validador-partidos');
    expect((error.causa as Error).message).toBe('timeout validador');
    expect(repositorio.guardarEvaluacion).not.toHaveBeenCalled();
  });
});
