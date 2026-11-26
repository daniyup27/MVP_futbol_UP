// src/__tests__/integration/registroConPrisma.test.ts
// FPI-III-09 · Regresión de la colaboración modificada: servicio + adaptador Prisma.
import request = require('supertest');
import { IncomingMessage } from 'http';
import { crearServicioBienestar } from '../../composicion/bienestar';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarPrisma } from '../../infrastructure/adapters/RepositorioBienestarPrisma';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { crearServidorEvaluaciones, RUTA_EVALUACIONES } from '../../presentation/http/evaluacionesHttp';
import { ClientePrismaFalso } from '../dobles/ClientePrismaFalso';

function montar(cliente: ClientePrismaFalso) {
  const partido = Partido.programado('partido-7');
  partido.finalizar(3, 2);
  const servicio = crearServicioBienestar({
    repositorio: new RepositorioBienestarPrisma(cliente),
    validador: new ValidadorPartidoEnMemoria([partido]),
  });
  return crearServidorEvaluaciones({
    servicio,
    autenticar: (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null,
  });
}

describe('POST evaluaciones con RepositorioBienestarPrisma', () => {
  it('201 con el id que asignó la base y una fila guardada', async () => {
    const cliente = new ClientePrismaFalso();
    const res = await request(montar(cliente))
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });
    expect(res.status).toBe(201);
    expect(res.body.idEvaluacion).toBe('db-1');
    expect(cliente.filas.get('db-1')?.idAnonimoHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('503 si Prisma no alcanza la base (P1001) y no queda ninguna fila', async () => {
    const cliente = new ClientePrismaFalso();
    cliente.caido = true;
    const res = await request(montar(cliente))
      .post(RUTA_EVALUACIONES)
      .set('x-sub-prueba', 'estudiante-A')
      .send({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });
    expect(res.status).toBe(503);
    expect(cliente.filas.size).toBe(0);
  });
});
