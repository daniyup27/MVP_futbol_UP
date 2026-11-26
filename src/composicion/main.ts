// src/composicion/main.ts
// Punto de entrada del contenedor (FPI-III-15). Lee la configuración del entorno, aplica las
// migraciones pendientes y levanta el servidor. Los secretos solo se leen aquí y nunca se
// escriben en el log; el log tampoco incluye identificadores de estudiantes (Ley 1581).
import { ClienteSqlPg } from '../infrastructure/persistencia/ClienteSqlPg';
import { aplicarMigraciones } from '../infrastructure/persistencia/migraciones';
import { AnonimizadorHmac } from '../infrastructure/seguridad/AnonimizadorHmac';
import { crearAplicacion } from './aplicacion';

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) throw new Error(`Falta la variable de entorno ${nombre}`);
  return valor;
}

function log(evento: string, datos: Record<string, unknown> = {}): void {
  process.stdout.write(JSON.stringify({ evento, momento: new Date().toISOString(), ...datos }) + '\n');
}

async function principal(): Promise<void> {
  const inicio = Date.now();
  const version = process.env.APP_VERSION ?? 'sin-version';
  const anonimizador = AnonimizadorHmac.desdeEntorno(); // falla si ANONIMIZATION_SALT falta o es corto
  const jwtSecret = requerida('JWT_SECRET');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  const cliente = ClienteSqlPg.desdeUrl(requerida('DATABASE_URL'), Number(process.env.DB_MAX_CONEXIONES ?? 10));
  const migraciones = await aplicarMigraciones(cliente);
  const partidosFinalizados = (process.env.PARTIDOS_FINALIZADOS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const servidor = crearAplicacion({ cliente, jwtSecret, partidosFinalizados, version, anonimizador });
  const puerto = Number(process.env.PORT ?? 3000);
  servidor.listen(puerto, () =>
    log('arranque', { version, puerto, migracionesAplicadas: migraciones, msHastaListo: Date.now() - inicio })
  );
  const detener = () => {
    log('detencion', { version });
    servidor.close(() => void cliente.cerrar().then(() => process.exit(0)));
  };
  process.on('SIGTERM', detener);
  process.on('SIGINT', detener);
}

principal().catch((error: Error) => {
  log('arranque_fallido', { motivo: error.message });
  process.exit(1);
});
