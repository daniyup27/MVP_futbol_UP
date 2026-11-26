// src/infrastructure/observabilidad/registroEvaluacionInstrumentado.ts
//
// Instrumentación (traza, métricas y log) del caso de uso "registrar evaluación".
// Antes vivía en src/core/bienestar/evaluaciones.service.ts, dentro del núcleo, y
// además devolvía un resultado fijo ('anon-xyz-123') en lugar de llamar al caso de
// uso real. Ahora es un envoltorio de infraestructura: mide y registra alrededor de
// ServicioBienestar y le delega la operación completa (FPI-III-05).
import { trace, metrics, SpanStatusCode } from '@opentelemetry/api';
import type { Logger } from 'pino';
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { logger as loggerPorDefecto } from './logger';

type RegistrarEvaluacion = Pick<ServicioBienestar, 'registrarEvaluacion'>;

const tracer = trace.getTracer('mvp-futbol-up');
const meter = metrics.getMeter('mvp-futbol-up');

const evaluacionesCounter = meter.createCounter('evaluaciones_registradas_total', {
  description: 'Número total de evaluaciones de bienestar registradas',
});

const evaluacionesDuration = meter.createHistogram('evaluaciones_duration_ms', {
  description: 'Duración en milisegundos del registro de evaluaciones',
  unit: 'ms',
});

export class RegistroEvaluacionInstrumentado implements RegistrarEvaluacion {
  constructor(
    private readonly servicio: RegistrarEvaluacion,
    private readonly log: Logger = loggerPorDefecto
  ) {}

  async registrarEvaluacion(
    idEstudiante: string,
    idTorneo: string,
    idPartido: string,
    escalaFisica: number,
    escalaMental: number
  ): Promise<string> {
    return tracer.startActiveSpan('bienestar.registrarEvaluacion', async (span) => {
      const inicio = Date.now();
      // Atributos sin PII (Ley 1581): ni idEstudiante ni hash viajan en la traza.
      span.setAttribute('endpoint', '/bienestar/evaluaciones');
      try {
        const id = await this.servicio.registrarEvaluacion(
          idEstudiante,
          idTorneo,
          idPartido,
          escalaFisica,
          escalaMental
        );
        evaluacionesCounter.add(1);
        evaluacionesDuration.record(Date.now() - inicio, { status: 'success' });
        this.log.info({ evento: 'evaluacion_registrada', duracionMs: Date.now() - inicio });
        span.setStatus({ code: SpanStatusCode.OK });
        return id;
      } catch (error) {
        evaluacionesDuration.record(Date.now() - inicio, { status: 'error' });
        span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error al registrar evaluación' });
        span.recordException(error as Error);
        this.log.error({ evento: 'error_evaluacion', error: (error as Error).message });
        throw error;
      } finally {
        span.end();
      }
    });
  }
}
