// src/composicion/aplicacion.ts
// Arma el servidor de producción del módulo de bienestar (FPI-III-15): Data Mapper SQL,
// verificación JWT, healthcheck y la ruta de autoevaluaciones. Recibe el ClienteSql ya
// creado para poder probarlo con PGlite y ejecutarlo con `pg` sin cambiar nada más.
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { Partido } from '../core/dominio/Partido';
import { IAnonimizador } from '../core/ports/IAnonimizador';
import { RepositorioBienestarSql } from '../infrastructure/adapters/RepositorioBienestarSql';
import { ValidadorPartidoEnMemoria } from '../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { ClienteSql } from '../infrastructure/persistencia/ClienteSql';
import { verificarJwtHs256 } from '../infrastructure/seguridad/verificarJwt';
import { crearManejadorEvaluaciones } from '../presentation/http/evaluacionesHttp';
import { crearServicioBienestar } from './bienestar';

export const RUTA_SALUD = '/api/health';

export interface ConfiguracionAplicacion {
  cliente: ClienteSql;
  jwtSecret: string;
  /** Partidos que el validador en memoria reconoce como finalizados (datos de demostración). */
  partidosFinalizados: string[];
  version: string;
  anonimizador?: IAnonimizador;
}

export function crearAplicacion(config: ConfiguracionAplicacion): Server {
  const partidos = config.partidosFinalizados.map((id) => {
    const p = Partido.programado(id);
    p.finalizar(0, 0);
    return p;
  });
  const servicio = crearServicioBienestar({
    repositorio: new RepositorioBienestarSql(config.cliente),
    validador: new ValidadorPartidoEnMemoria(partidos),
    anonimizador: config.anonimizador,
  });
  const evaluaciones = crearManejadorEvaluaciones({
    servicio,
    autenticar: (req: IncomingMessage) => {
      const cabecera = req.headers.authorization ?? '';
      return cabecera.startsWith('Bearer ') ? verificarJwtHs256(cabecera.slice(7), config.jwtSecret) : null;
    },
  });

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'GET' && req.url === RUTA_SALUD) {
      let baseDeDatos = 'ok';
      try {
        await config.cliente.query('SELECT 1');
      } catch {
        baseDeDatos = 'no_disponible';
      }
      res.writeHead(baseDeDatos === 'ok' ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: baseDeDatos === 'ok' ? 'ok' : 'degradado', version: config.version, baseDeDatos }));
      return;
    }
    evaluaciones(req, res);
  });
}
