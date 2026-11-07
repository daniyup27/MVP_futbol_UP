// src/core/logger.ts
import pino from 'pino';

/**
 * Logger estructurado en JSON con redacción automática de PII (Ley 1581).
 * Nunca se registran datos personales identificables en la telemetría.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: {
    service: 'mvp-futbol-up',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '0.1.0',
  },
  // Redacción automática de campos sensibles (Ley 1581 de 2012)
  redact: {
    paths: ['*.email', '*.telefono', '*.cedula', '*.idEstudiante', '*.nombre', '*.password'],
    censor: '[REDACTADO-Ley1581]',
  },
});
