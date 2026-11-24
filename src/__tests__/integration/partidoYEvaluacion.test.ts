// src/__tests__/integration/partidoYEvaluacion.test.ts
// FPI-III-08 · Colaboración: el servicio consulta al validador y la entidad Partido decide.
import { crearServicioBienestar } from '../../composicion/bienestar';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';

describe('Registrar evaluación según el estado de la entidad Partido', () => {
  it('se registra cuando el partido fue finalizado con finalizar()', async () => {
    const partido = Partido.programado('partido-7');
    partido.finalizar(2, 1);
    const repositorio = new RepositorioBienestarEnMemoria();
    const servicio = crearServicioBienestar({ repositorio, validador: new ValidadorPartidoEnMemoria([partido]) });

    await expect(servicio.registrarEvaluacion('estudiante-A', 't-1', 'partido-7', 5, 1)).resolves.toBe('mem-1');
    expect(repositorio.listar()[0].evaluacion).toMatchObject({ idPartido: 'partido-7', escalaFisica: 5, escalaMental: 1 });
  });

  it('se rechaza si el partido sigue PROGRAMADO o no existe, y no se guarda nada', async () => {
    const repositorio = new RepositorioBienestarEnMemoria();
    const servicio = crearServicioBienestar({
      repositorio,
      validador: new ValidadorPartidoEnMemoria([Partido.programado('partido-8')]),
    });

    await expect(servicio.registrarEvaluacion('estudiante-A', 't-1', 'partido-8', 4, 3)).rejects.toMatchObject({
      codigo: 'PARTIDO_NO_FINALIZADO',
    });
    await expect(servicio.registrarEvaluacion('estudiante-A', 't-1', 'no-existe', 4, 3)).rejects.toMatchObject({
      codigo: 'PARTIDO_NO_FINALIZADO',
    });
    expect(repositorio.listar()).toHaveLength(0);
  });
});
