// src/__tests__/integration/creacionIncompleta.test.ts
// FPI-III-13 · Una autoevaluación incompleta no llega al repositorio, aunque el error venga
// de un colaborador mal implementado (aquí, un anonimizador que devuelve el id en claro).
import request = require('supertest');
import { IncomingMessage } from 'http';
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { crearServidorEvaluaciones, RUTA_EVALUACIONES } from '../../presentation/http/evaluacionesHttp';

describe('Creación incompleta', () => {
  it('el servicio no persiste nada y HTTP responde 500 sin exponer el dato', async () => {
    const partido = Partido.programado('partido-7');
    partido.finalizar(1, 0);
    const repositorio = new RepositorioBienestarEnMemoria();
    const anonimizadorDefectuoso = { generarHash: (id: string) => id }; // devuelve el id en claro
    const servicio = new ServicioBienestar(repositorio, new ValidadorPartidoEnMemoria([partido]), anonimizadorDefectuoso);
    const servidor = crearServidorEvaluaciones({
      servicio,
      autenticar: (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null,
    });

    const res = await request(servidor)
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', '1090000000')
      .send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });

    expect(res.status).toBe(500);
    expect(res.body.codigo).toBe('ERROR_INTERNO');
    expect(JSON.stringify(res.body)).not.toContain('1090000000');
    expect(repositorio.listar()).toHaveLength(0);
  });
});
