// src/app/api/health/route.ts
import { NextResponse } from 'next/server';

/**
 * Endpoint de healthcheck para verificación post-despliegue.
 * Utilizado por el pipeline de CD (ADR-11) para verificar
 * que el sistema está operativo tras cada despliegue.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      service: 'MVP Fútbol UP',
    },
    { status: 200 }
  );
}
