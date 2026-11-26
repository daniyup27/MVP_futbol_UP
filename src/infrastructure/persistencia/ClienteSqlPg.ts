// src/infrastructure/persistencia/ClienteSqlPg.ts
// ClienteSql de producción sobre un pool de `pg` (FPI-III-15). Misma forma que el cliente
// PGlite de las pruebas: el Data Mapper y las migraciones no saben cuál de los dos usan.
import { Pool, PoolClient } from 'pg';
import { ClienteSql, ResultadoSql } from './ClienteSql';

class ClienteSobreConexion implements ClienteSql {
  constructor(private readonly conexion: PoolClient) {}

  async query<T>(sql: string, parametros: unknown[] = []): Promise<ResultadoSql<T>> {
    const r = await this.conexion.query(sql, parametros);
    return { rows: r.rows as T[] };
  }

  async ejecutarScript(sql: string): Promise<void> {
    await this.conexion.query(sql);
  }

  async transaccion<T>(trabajo: (tx: ClienteSql) => Promise<T>): Promise<T> {
    return trabajo(this); // ya dentro de una transacción
  }
}

export class ClienteSqlPg implements ClienteSql {
  constructor(private readonly pool: Pool) {}

  static desdeUrl(url: string, maxConexiones = 10): ClienteSqlPg {
    return new ClienteSqlPg(new Pool({ connectionString: url, max: maxConexiones }));
  }

  async query<T>(sql: string, parametros: unknown[] = []): Promise<ResultadoSql<T>> {
    const r = await this.pool.query(sql, parametros);
    return { rows: r.rows as T[] };
  }

  async ejecutarScript(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async transaccion<T>(trabajo: (tx: ClienteSql) => Promise<T>): Promise<T> {
    const conexion = await this.pool.connect();
    try {
      await conexion.query('BEGIN');
      const resultado = await trabajo(new ClienteSobreConexion(conexion));
      await conexion.query('COMMIT');
      return resultado;
    } catch (error) {
      await conexion.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      conexion.release();
    }
  }

  async cerrar(): Promise<void> {
    await this.pool.end();
  }
}
