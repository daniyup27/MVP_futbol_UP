// src/__tests__/despliegue/aplicacion.test.ts
// FPI-III-15 · El servidor de producción (healthcheck, JWT, Data Mapper SQL) probado con
// PostgreSQL embebido. Es la misma composición que arranca el contenedor.
import request = require('supertest');
import { crearAplicacion } from '../../composicion/aplicacion';
import { aplicarMigraciones } from '../../infrastructure/persistencia/migraciones';
import { firmarJwtHs256, verificarJwtHs256 } from '../../infrastructure/seguridad/verificarJwt';
import { ClienteSql } from '../../infrastructure/persistencia/ClienteSql';
import { ClienteSqlPGlite } from '../soporte/ClienteSqlPGlite';

const SECRETO = 'secreto-de-prueba-con-mas-de-32-caracteres';
const RUTA = '/api/bienestar/evaluaciones';

describe('verificarJwtHs256', () => {
  it('devuelve el sub de un token válido', () => {
    expect(verificarJwtHs256(firmarJwtHs256({ sub: 'estudiante-A' }, SECRETO), SECRETO)).toBe('estudiante-A');
  });
  it('rechaza firma con otro secreto, token vencido, alg distinto y basura', () => {
    expect(verificarJwtHs256(firmarJwtHs256({ sub: 'x' }, 'otro-secreto-de-mas-de-32-caracteres!!'), SECRETO)).toBeNull();
    expect(verificarJwtHs256(firmarJwtHs256({ sub: 'x', exp: 1 }, SECRETO), SECRETO)).toBeNull();
    const [, carga, firma] = firmarJwtHs256({ sub: 'x' }, SECRETO).split('.');
    const none = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
    expect(verificarJwtHs256(`${none}.${carga}.${firma}`, SECRETO)).toBeNull();
    expect(verificarJwtHs256('no-es-un-token', SECRETO)).toBeNull();
  });
});

describe('Servidor de producción sobre PostgreSQL embebido', () => {
  let cliente: ClienteSqlPGlite;
  beforeEach(async () => {
    cliente = await ClienteSqlPGlite.abrir();
    await aplicarMigraciones(cliente);
  });
  afterEach(async () => cliente.cerrar());

  const app = (c: ClienteSql) =>
    crearAplicacion({ cliente: c, jwtSecret: SECRETO, partidosFinalizados: ['partido-7'], version: '0.2.0-prueba' });

  it('healthcheck: 200 con la versión cuando la base responde', async () => {
    const res = await request(app(cliente)).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', version: '0.2.0-prueba', baseDeDatos: 'ok' });
  });

  it('healthcheck: 503 cuando la base no responde', async () => {
    const caido: ClienteSql = { ...cliente, query: async () => { throw Object.assign(new Error('x'), { code: 'ECONNREFUSED' }); } } as never;
    const res = await request(app(caido)).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body.baseDeDatos).toBe('no_disponible');
  });

  it('con token válido registra y la fila queda en la tabla solo con el seudónimo', async () => {
    const token = firmarJwtHs256({ sub: '1090000000' }, SECRETO);
    const res = await request(app(cliente)).post(RUTA).set('Authorization', `Bearer ${token}`)
      .send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });
    expect(res.status).toBe(201);
    const { rows } = await cliente.query<{ id_anonimo_hash: string }>('SELECT id_anonimo_hash FROM autoevaluacion_bienestar');
    expect(rows).toHaveLength(1);
    expect(rows[0].id_anonimo_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(res.body)).not.toContain('1090000000');
  });

  it('sin token o con token inválido responde 401 y no guarda nada', async () => {
    const a = app(cliente);
    expect((await request(a).post(RUTA).send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 })).status).toBe(401);
    expect((await request(a).post(RUTA).set('Authorization', 'Bearer abc.def.ghi')
      .send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 })).status).toBe(401);
    const { rows } = await cliente.query<{ n: number }>('SELECT count(*)::int AS n FROM autoevaluacion_bienestar');
    expect(rows[0].n).toBe(0);
  });
});
