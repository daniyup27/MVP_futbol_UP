// src/__tests__/integration/unicidadEvaluacion.test.ts
// FPI-III-11 · CP-03 de punta a punta: mismo escenario que la revisión RD-01 (H-01).
import request = require('supertest');
import { IncomingMessage } from 'http';
import { crearServicioBienestar } from '../../composicion/bienestar';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { crearServidorEvaluaciones, RUTA_EVALUACIONES } from '../../presentation/http/evaluacionesHttp';

function escenario() {
  const partido = Partido.programado('partido-7');
  partido.finalizar(2, 1);
  const repositorio = new RepositorioBienestarEnMemoria();
  const servicio = crearServicioBienestar({ repositorio, validador: new ValidadorPartidoEnMemoria([partido]) });
  return { repositorio, servicio };
}

describe('CP-03 · una autoevaluación por estudiante y partido', () => {
  it('reintento con las mismas escalas: mismo id y un solo registro', async () => {
    const { repositorio, servicio } = escenario();
    const primero = await servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    const reintento = await servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    expect(reintento).toBe(primero);
    expect(repositorio.listar()).toHaveLength(1);
  });

  it('escalas distintas: EVALUACION_YA_REGISTRADA y se conserva la primera', async () => {
    const { repositorio, servicio } = escenario();
    await servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    await expect(servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 2, 2)).rejects.toMatchObject({
      codigo: 'EVALUACION_YA_REGISTRADA',
    });
    expect(repositorio.listar()).toHaveLength(1);
    expect(repositorio.listar()[0].evaluacion).toMatchObject({ escalaFisica: 4, escalaMental: 3 });
  });

  it('otro estudiante en el mismo partido sí registra su propia evaluación', async () => {
    const { repositorio, servicio } = escenario();
    await servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    await servicio.registrarEvaluacion('estudiante-B', 't', 'partido-7', 4, 3);
    expect(repositorio.listar()).toHaveLength(2);
  });

  it('por HTTP el envío distinto responde 409 EVALUACION_YA_REGISTRADA y el reintento 201 con el mismo id', async () => {
    const { servicio } = escenario();
    const servidor = crearServidorEvaluaciones({
      servicio,
      autenticar: (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null,
    });
    const enviar = (ef: number, em: number) =>
      request(servidor).post(RUTA_EVALUACIONES).set('x-sub-prueba', 'estudiante-A').send({ idPartido: 'partido-7', escalaFisica: ef, escalaMental: em });
    const primero = await enviar(4, 3);
    const reintento = await enviar(4, 3);
    const distinto = await enviar(1, 1);
    expect([primero.status, reintento.status, distinto.status]).toEqual([201, 201, 409]);
    expect(reintento.body.idEvaluacion).toBe(primero.body.idEvaluacion);
    expect(distinto.body.codigo).toBe('EVALUACION_YA_REGISTRADA');
  });

  it('H-02 por HTTP: un partido inexistente responde 404 PARTIDO_NO_ENCONTRADO', async () => {
    const { servicio } = escenario();
    const servidor = crearServidorEvaluaciones({
      servicio,
      autenticar: (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null,
    });
    const res = await request(servidor)
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'no-existe', escalaFisica: 4, escalaMental: 3 });
    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('PARTIDO_NO_ENCONTRADO');
  });
});
