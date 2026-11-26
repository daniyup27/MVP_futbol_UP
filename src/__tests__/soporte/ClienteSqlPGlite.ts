// src/__tests__/soporte/ClienteSqlPGlite.ts
// ClienteSql sobre PGlite: PostgreSQL real compilado a WebAssembly, sin servidor ni Docker.
// Con `directorio` los datos se guardan en disco y sobreviven a cerrar y volver a abrir.
import { PGlite } from '@electric-sql/pglite';
import { ClienteSql, ResultadoSql } from '../../infrastructure/persistencia/ClienteSql';

type Ejecutor = { query: PGlite['query']; exec: PGlite['exec'] };

class ClienteSobre implements ClienteSql {
  constructor(protected readonly db: Ejecutor, private readonly raiz?: PGlite) {}

  async query<T>(sql: string, parametros: unknown[] = []): Promise<ResultadoSql<T>> {
    const r = await this.db.query<T>(sql, parametros as never[]);
    return { rows: r.rows };
  }

  async ejecutarScript(sql: string): Promise<void> {
    await this.db.exec(sql);
  }

  async transaccion<T>(trabajo: (tx: ClienteSql) => Promise<T>): Promise<T> {
    if (!this.raiz) return trabajo(this); // ya dentro de una transacción
    return this.raiz.transaction(async (tx) => trabajo(new ClienteSobre(tx as unknown as Ejecutor)));
  }
}

export class ClienteSqlPGlite extends ClienteSobre {
  private constructor(private readonly instancia: PGlite) {
    super(instancia, instancia);
  }

  static async abrir(directorio?: string): Promise<ClienteSqlPGlite> {
    const db = directorio ? new PGlite(directorio) : new PGlite();
    await db.waitReady;
    return new ClienteSqlPGlite(db);
  }

  async cerrar(): Promise<void> {
    await this.instancia.close();
  }
}
