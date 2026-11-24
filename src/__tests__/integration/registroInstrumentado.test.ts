// src/__tests__/integration/registroInstrumentado.test.ts
// FPI-III-05 · El envoltorio de observabilidad no altera el resultado del caso nominal
// ni el error del caso rechazado, y su log no contiene datos del estudiante.
import pino from 'pino';
import { Writable } from 'stream';
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';
import { AnonimizadorHmac } from '../../infrastructure/seguridad/AnonimizadorHmac';
import { RegistroEvaluacionInstrumentado } from '../../infrastructure/observabilidad/registroEvaluacionInstrumentado';

function loggerEnMemoria() {
  const lineas: string[] = [];
  const destino = new Writable({
    write(chunk, _enc, cb) {
      lineas.push(chunk.toString());
      cb();
    },
  });
  return { log: pino({ level: 'info' }, destino), lineas };
}

describe('RegistroEvaluacionInstrumentado (infraestructura)', () => {
  const repositorio: IRepositorioBienestar = { guardarEvaluacion: async () => 'db-id-1' };
  const validador: IValidadorPartido = { estaFinalizado: async (id) => id === 'partido-finalizado' };
  const servicio = new ServicioBienestar(repositorio, validador, AnonimizadorHmac.desdeEntorno());

  it('devuelve el mismo id que el caso de uso sin instrumentar', async () => {
    const { log, lineas } = loggerEnMemoria();
    const instrumentado = new RegistroEvaluacionInstrumentado(servicio, log);

    const directo = await servicio.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-finalizado', 4, 3);
    const envuelto = await instrumentado.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-finalizado', 4, 3);

    expect(envuelto).toBe(directo);
    expect(lineas.join('')).toContain('evaluacion_registrada');
    expect(lineas.join('')).not.toContain('estudiante-A');
  });

  it('propaga el mismo error del dominio y deja el evento de error en el log', async () => {
    const { log, lineas } = loggerEnMemoria();
    const instrumentado = new RegistroEvaluacionInstrumentado(servicio, log);

    await expect(
      instrumentado.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-en-curso', 4, 3)
    ).rejects.toThrow('No se puede evaluar un partido no finalizado');
    expect(lineas.join('')).toContain('error_evaluacion');
    expect(lineas.join('')).not.toContain('estudiante-A');
  });
});
