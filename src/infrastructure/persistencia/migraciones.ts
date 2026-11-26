// src/infrastructure/persistencia/migraciones.ts
// Aplica en orden los archivos db/migraciones/NNN_nombre.sql que aún no están en
// schema_migraciones. Cada migración y su registro van en la MISMA transacción:
// si una sentencia falla, no queda ni el cambio a medias ni la versión registrada.
import * as fs from 'fs';
import * as path from 'path';
import { ClienteSql } from './ClienteSql';

export const CARPETA_MIGRACIONES = path.resolve(__dirname, '../../../db/migraciones');

export interface Migracion {
  version: number;
  nombre: string;
  sql: string;
}

export function leerMigraciones(carpeta = CARPETA_MIGRACIONES): Migracion[] {
  return fs
    .readdirSync(carpeta)
    .filter((f) => /^\d{3}_.+\.sql$/.test(f))
    .sort()
    .map((f) => ({ version: Number(f.slice(0, 3)), nombre: f, sql: fs.readFileSync(path.join(carpeta, f), 'utf8') }));
}

export async function aplicarMigraciones(cliente: ClienteSql, migraciones = leerMigraciones()): Promise<number[]> {
  await cliente.query(
    `CREATE TABLE IF NOT EXISTS schema_migraciones (
       version INTEGER PRIMARY KEY,
       nombre TEXT NOT NULL,
       aplicada_en TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  );
  const { rows } = await cliente.query<{ version: number }>('SELECT version FROM schema_migraciones');
  const aplicadas = new Set(rows.map((r) => Number(r.version)));
  const nuevas: number[] = [];
  for (const m of migraciones) {
    if (aplicadas.has(m.version)) continue;
    await cliente.transaccion(async (tx) => {
      await tx.ejecutarScript(m.sql);
      await tx.query('INSERT INTO schema_migraciones (version, nombre) VALUES ($1, $2)', [m.version, m.nombre]);
    });
    nuevas.push(m.version);
  }
  return nuevas;
}
