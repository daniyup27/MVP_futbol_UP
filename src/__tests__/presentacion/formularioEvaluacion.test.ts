// src/__tests__/presentacion/formularioEvaluacion.test.ts
// FPI-III-14 · Bloque B: entrada inválida, resultado exitoso y mensaje recuperable.
import request = require('supertest');
import { IncomingMessage } from 'http';
import { crearServicioBienestar } from '../../composicion/bienestar';
import { Partido } from '../../core/dominio/Partido';
import { IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { crearServidorEvaluaciones, RUTA_EVALUACIONES } from '../../presentation/http/evaluacionesHttp';
import { estadoTrasEnvio, validarFormulario } from '../../presentation/pwa/formularioEvaluacion';

function servidorCon(repositorio: IRepositorioBienestar) {
  const partido = Partido.programado('partido-7');
  partido.finalizar(2, 1);
  return crearServidorEvaluaciones({
    servicio: crearServicioBienestar({ repositorio, validador: new ValidadorPartidoEnMemoria([partido]) }),
    autenticar: (req: IncomingMessage) => (req.headers['x-sub-prueba'] as string) ?? null,
  });
}

async function enviarDesdeFormulario(repositorio: IRepositorioBienestar, entrada: Parameters<typeof validarFormulario>[0]) {
  const v = validarFormulario(entrada);
  if ('estado' in v) return v.estado;
  const res = await request(servidorCon(repositorio)).post(RUTA_EVALUACIONES).set('x-sub-prueba', 'estudiante-A').send(v.datos);
  return estadoTrasEnvio({ status: res.status, body: res.body });
}

describe('Formulario de autoevaluación (presentación)', () => {
  it('entrada inválida: escala vacía y fuera de rango se marcan por campo y no se envía nada', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const estado = await enviarDesdeFormulario(repo, { idPartido: 'partido-7', escalaFisica: '', escalaMental: '6' });
    expect(estado).toEqual({
      tipo: 'EDITANDO',
      errores: {
        escalaFisica: 'Marca cómo te sentiste físicamente (1 a 5).',
        escalaMental: 'La escala mental va de 1 a 5.',
      },
    });
    expect(repo.listar()).toHaveLength(0);
  });

  it('resultado exitoso: REGISTRADA con su mensaje y la evaluación sale de la cola', async () => {
    const repo = new RepositorioBienestarEnMemoria();
    const estado = await enviarDesdeFormulario(repo, { idPartido: 'partido-7', escalaFisica: '4', escalaMental: 3 });
    expect(estado).toEqual({
      tipo: 'REGISTRADA',
      mensaje: 'Tu autoevaluación quedó registrada. Gracias.',
      idEvaluacion: 'mem-1',
      conservarEnCola: false,
    });
  });

  it('mensaje recuperable: con la base caída (503) queda PENDIENTE y se conserva en la cola', async () => {
    const caido: IRepositorioBienestar = {
      buscarPorEstudianteYPartido: () => Promise.reject(Object.assign(new Error('x'), { code: 'ECONNREFUSED' })),
      guardarEvaluacion: () => Promise.reject(new Error('no debería llamarse')),
    };
    const estado = await enviarDesdeFormulario(caido, { idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });
    expect(estado).toEqual({
      tipo: 'PENDIENTE_SINCRONIZACION',
      mensaje: 'Guardamos tu autoevaluación en el teléfono y la enviaremos cuando haya conexión.',
      conservarEnCola: true,
    });
  });

  it('sin red se comporta igual que el 503', () => {
    expect(estadoTrasEnvio('SIN_RED')).toMatchObject({ tipo: 'PENDIENTE_SINCRONIZACION', conservarEnCola: true });
  });

  it('un rechazo de negocio no se reintenta: EVALUACION_YA_REGISTRADA sale de la cola con su mensaje', () => {
    expect(estadoTrasEnvio({ status: 409, body: { codigo: 'EVALUACION_YA_REGISTRADA' } })).toEqual({
      tipo: 'RECHAZADA',
      mensaje: 'Ya registraste una autoevaluación distinta para este partido.',
      conservarEnCola: false,
    });
  });

  it('un error interno no promete reintento automático', () => {
    expect(estadoTrasEnvio({ status: 500, body: { codigo: 'ERROR_INTERNO' } })).toMatchObject({ tipo: 'ERROR', conservarEnCola: false });
  });
});
