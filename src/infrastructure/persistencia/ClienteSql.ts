// src/infrastructure/persistencia/ClienteSql.ts
// Lo único que el Data Mapper y las migraciones necesitan de una conexión PostgreSQL.
// En pruebas lo implementa PGlite (PostgreSQL compilado a WebAssembly); en producción
// lo implementaría un pool de `pg` con la misma forma.
export interface ResultadoSql<T> {
  rows: T[];
}

export interface ClienteSql {
  query<T = Record<string, unknown>>(sql: string, parametros?: unknown[]): Promise<ResultadoSql<T>>;
  /** Ejecuta un script con varias sentencias y sin parámetros (migraciones). */
  ejecutarScript(sql: string): Promise<void>;
  /** Ejecuta `trabajo` dentro de BEGIN/COMMIT; si lanza, hace ROLLBACK y relanza. */
  transaccion<T>(trabajo: (tx: ClienteSql) => Promise<T>): Promise<T>;
}
