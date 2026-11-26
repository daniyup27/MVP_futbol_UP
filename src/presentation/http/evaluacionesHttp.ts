// src/presentation/http/evaluacionesHttp.ts
// Adaptador de presentación HTTP del caso de uso "registrar evaluación" (FPI-III-06).
// Valida la FORMA de la petición, llama al servicio de aplicación y traduce el
// resultado o el error tipado a un código HTTP. No conoce la base de datos.
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { ServicioBienestar } from '../../core/ServicioBienestar';
import {
  DependenciaNoDisponibleError,
  ErrorDeNegocio,
  EvaluacionYaRegistradaError,
  PartidoNoEncontradoError,
  PartidoNoFinalizadoError,
} from '../../core/errores';

export const RUTA_EVALUACIONES = '/api/bienestar/evaluaciones';

export interface RespuestaHttp {
  status: number;
  body: Record<string, unknown>;
}

/** Entrada pública. El idEstudiante NO viaja en el cuerpo: sale del token (claim sub). */
export interface EvaluacionRequest {
  idPartido: string;
  idTorneo?: string;
  escalaFisica: number;
  escalaMental: number;
}

type Registrador = Pick<ServicioBienestar, 'registrarEvaluacion'>;

function leerCuerpo(body: unknown): EvaluacionRequest | string {
  if (typeof body !== 'object' || body === null) return 'El cuerpo debe ser un objeto JSON';
  const b = body as Record<string, unknown>;
  if (typeof b.idPartido !== 'string' || b.idPartido.trim() === '') return 'idPartido es obligatorio';
  if (typeof b.escalaFisica !== 'number') return 'escalaFisica debe ser numérica';
  if (typeof b.escalaMental !== 'number') return 'escalaMental debe ser numérica';
  if ('idEstudiante' in b || 'cedula' in b || 'nombre' in b) {
    return 'El cuerpo no debe incluir datos personales (Ley 1581)';
  }
  return {
    idPartido: b.idPartido,
    idTorneo: typeof b.idTorneo === 'string' ? b.idTorneo : undefined,
    escalaFisica: b.escalaFisica,
    escalaMental: b.escalaMental,
  };
}

export async function manejarRegistroEvaluacion(
  servicio: Registrador,
  sub: string | null,
  body: unknown
): Promise<RespuestaHttp> {
  if (!sub) return { status: 401, body: { codigo: 'NO_AUTENTICADO', mensaje: 'Token ausente o inválido' } };

  const entrada = leerCuerpo(body);
  if (typeof entrada === 'string') return { status: 400, body: { codigo: 'FORMATO_INVALIDO', mensaje: entrada } };

  try {
    const idEvaluacion = await servicio.registrarEvaluacion(
      sub,
      entrada.idTorneo ?? '',
      entrada.idPartido,
      entrada.escalaFisica,
      entrada.escalaMental
    );
    return { status: 201, body: { idEvaluacion, mensaje: 'Evaluación registrada correctamente.' } };
  } catch (error) {
    if (error instanceof PartidoNoEncontradoError) {
      return { status: 404, body: { codigo: error.codigo, mensaje: error.message } };
    }
    if (error instanceof PartidoNoFinalizadoError || error instanceof EvaluacionYaRegistradaError) {
      return { status: 409, body: { codigo: error.codigo, mensaje: error.message } };
    }
    if (error instanceof ErrorDeNegocio) {
      return { status: 400, body: { codigo: error.codigo, mensaje: error.message } };
    }
    if (error instanceof DependenciaNoDisponibleError) {
      // No se expone la causa técnica al cliente; la PWA conserva la evaluación en cola.
      return {
        status: 503,
        body: { codigo: error.codigo, mensaje: 'Servicio temporalmente no disponible, intenta de nuevo' },
      };
    }
    return { status: 500, body: { codigo: 'ERROR_INTERNO', mensaje: 'Error inesperado' } };
  }
}

export interface DependenciasServidor {
  servicio: Registrador;
  /** Devuelve el claim sub del token o null. En producción lo resuelve la verificación JWT. */
  autenticar: (req: IncomingMessage) => string | null;
}

/** Servidor Node mínimo para ejecutar el ejemplo y las pruebas HTTP (sin Next.js). */
export function crearServidorEvaluaciones(deps: DependenciasServidor): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const responder = (r: RespuestaHttp) => {
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(r.body));
    };
    if (req.method !== 'POST' || req.url !== RUTA_EVALUACIONES) {
      responder({ status: 404, body: { codigo: 'NO_ENCONTRADO' } });
      return;
    }
    let crudo = '';
    req.on('data', (parte) => (crudo += parte));
    req.on('end', async () => {
      let body: unknown;
      try {
        body = crudo ? JSON.parse(crudo) : undefined;
      } catch {
        responder({ status: 400, body: { codigo: 'FORMATO_INVALIDO', mensaje: 'JSON mal formado' } });
        return;
      }
      responder(await manejarRegistroEvaluacion(deps.servicio, deps.autenticar(req), body));
    });
  });
}
