// src/core/bienestar/evaluaciones.service.ts
import { trace, SpanStatusCode, metrics } from '@opentelemetry/api';
import { logger } from '../logger';

const tracer = trace.getTracer('mvp-futbol-up');
const meter = metrics.getMeter('mvp-futbol-up');

// Métricas agregadas
const evaluacionesCounter = meter.createCounter('evaluaciones_registradas_total', {
  description: 'Número total de evaluaciones de bienestar registradas',
});

const evaluacionesDuration = meter.createHistogram('evaluaciones_duration_ms', {
  description: 'Duración en milisegundos del endpoint de evaluaciones',
  unit: 'ms',
});

export interface EvaluacionInput {
  tipoTorneo: string;
  escalaFisica: number;
  escalaMental: number;
}

/**
 * Registra una evaluación de bienestar instrumentada con OpenTelemetry.
 * Los atributos del Span NUNCA contienen PII (Ley 1581).
 */
export async function registrarEvaluacion(data: EvaluacionInput) {
  return tracer.startActiveSpan('bienestar.registrarEvaluacion', async (span) => {
    const startTime = Date.now();
    
    try {
      // Atributos del span: SOLO datos no sensibles
      span.setAttribute('endpoint', '/bienestar/evaluaciones');
      span.setAttribute('tipoTorneo', data.tipoTorneo);
      span.setAttribute('escalasCompletas', 'true');
      
      // Simulación de lógica de negocio (guardar en BD)
      const resultado = { idAnonimoHash: 'anon-xyz-123', status: 'created' };
      
      // Registro de métricas
      evaluacionesCounter.add(1, { tipoTorneo: data.tipoTorneo });
      evaluacionesDuration.record(Date.now() - startTime, { 
        status: 'success',
        tipoTorneo: data.tipoTorneo 
      });
      
      // Log estructurado SIN PII
      logger.info({
        evento: 'evaluacion_registrada',
        tipoTorneo: data.tipoTorneo,
        duracionMs: Date.now() - startTime,
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return resultado;
    } catch (error) {
      evaluacionesDuration.record(Date.now() - startTime, { status: 'error' });
      span.setStatus({ code: SpanStatusCode.ERROR, message: 'Error al registrar evaluación' });
      span.recordException(error as Error);
      
      logger.error({
        evento: 'error_evaluacion',
        error: (error as Error).message,
      });
      
      throw error;
    } finally {
      span.end();
    }
  });
}
