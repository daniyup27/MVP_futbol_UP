// src/telemetry/setup.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { Resource } from '@opentelemetry/resources';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

/**
 * Configuración del SDK de OpenTelemetry (ADR-13).
 * Se utiliza TraceIdRatioBasedSampler(0.1) para muestrear solo el 10% 
 * de las trazas y no degradar el rendimiento en el free tier de Render.
 */
export function setupTelemetry() {
  const sdk = new NodeSDK({
    resource: new Resource({
      'service.name': 'mvp-futbol-up',
      'service.version': '0.1.0',
    }),
    // Muestreo del 10% para controlar el overhead de rendimiento
    sampler: new TraceIdRatioBasedSampler(0.1),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    metricExporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/metrics',
    }),
    spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter()),
  });

  sdk.start();
  return sdk;
}
