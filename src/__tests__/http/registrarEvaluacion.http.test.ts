// src/__tests__/http/registrarEvaluacion.http.test.ts
// FPI-III-06 · Recorrido vertical presentación → aplicación → dominio → infraestructura.
// Ejecutar: npx jest src/__tests__/http
// Usa el servidor Node del adaptador HTTP y el repositorio en memoria para poder
// consultar el estado de datos después de cada petición. No toca ninguna base real.
import request = require('supertest');
import { IncomingMessage } from 'http';
import { crearServicioBienestar } from '../../composicion/bienestar';
import { IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { crearServidorEvaluaciones, RUTA_EVALUACIONES } from '../../presentation/http/evaluacionesHttp';

// Autenticación de prueba: en producción el sub sale del JWT verificado.
const autenticarPrueba = (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null;
const validador: IValidadorPartido = { consultarEstado: async (id) => (id === 'partido-finalizado' ? 'FINALIZADO' : 'PROGRAMADO') };

function montar(repositorio: IRepositorioBienestar) {
  const servicio = crearServicioBienestar({ repositorio, validador });
  return crearServidorEvaluaciones({ servicio, autenticar: autenticarPrueba });
}

describe(`POST ${RUTA_EVALUACIONES}`, () => {
  it('camino exitoso: 201 y queda una evaluación guardada solo con el hash', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const res = await request(montar(repo))
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-finalizado', escalaFisica: 4, escalaMental: 3 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ idEvaluacion: 'mem-1', mensaje: 'Evaluación registrada correctamente.' });
    const guardadas = repo.listar();
    expect(guardadas).toHaveLength(1);
    expect(guardadas[0].evaluacion.idAnonimoHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(guardadas)).not.toContain('estudiante-A');
    expect(JSON.stringify(res.body)).not.toContain('estudiante-A');
  });

  it('rechazo por regla: partido no finalizado responde 409 y no persiste nada', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const res = await request(montar(repo))
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-en-curso', escalaFisica: 4, escalaMental: 3 });

    expect(res.status).toBe(409);
    expect(res.body.codigo).toBe('PARTIDO_NO_FINALIZADO');
    expect(repo.listar()).toHaveLength(0);
  });

  it('dependencia no disponible: la base rechaza la conexión y se responde 503, no 409', async () => {
    const repoCaido: IRepositorioBienestar = {
      buscarPorEstudianteYPartido: async () => null,
    guardarEvaluacion: jest.fn().mockRejectedValue(
        Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:5432'), { code: 'ECONNREFUSED' })
      ),
    };
    const res = await request(montar(repoCaido))
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-finalizado', escalaFisica: 4, escalaMental: 3 });

    expect(res.status).toBe(503);
    expect(res.body.codigo).toBe('DEPENDENCIA_NO_DISPONIBLE');
    expect(JSON.stringify(res.body)).not.toContain('ECONNREFUSED');
    expect(repoCaido.guardarEvaluacion).toHaveBeenCalledTimes(1);
  });

  it('rechazo por regla: escala fuera de 1..5 responde 400 sin consultar el validador', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const validadorEspia: IValidadorPartido = { consultarEstado: jest.fn().mockResolvedValue('FINALIZADO') };
    const servidor = crearServidorEvaluaciones({
      servicio: crearServicioBienestar({ repositorio: repo, validador: validadorEspia }),
      autenticar: autenticarPrueba,
    });
    const res = await request(servidor)
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-finalizado', escalaFisica: 6, escalaMental: 3 });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('DATOS_INVALIDOS');
    expect(validadorEspia.consultarEstado).not.toHaveBeenCalled();
    expect(repo.listar()).toHaveLength(0);
  });

  it('sin token responde 401 y con datos personales en el cuerpo responde 400', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const servidor = montar(repo);
    const sinToken = await request(servidor)
      .post(RUTA_EVALUACIONES)
      .send({ idPartido: 'partido-finalizado', escalaFisica: 4, escalaMental: 3 });
    const conPii = await request(servidor)
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-finalizado', escalaFisica: 4, escalaMental: 3, cedula: '1090000000' });

    expect(sinToken.status).toBe(401);
    expect(conPii.status).toBe(400);
    expect(repo.listar()).toHaveLength(0);
  });
});
