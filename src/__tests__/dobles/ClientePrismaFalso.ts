// src/__tests__/dobles/ClientePrismaFalso.ts
// Cliente falso con la misma forma que usa RepositorioBienestarPrisma. Guarda en
// memoria y puede simular la base caída con el código real de Prisma (P1001).
import { EvaluacionAnonima } from '../../core/ports/IRepositorioBienestar';
import { ClienteAutoevaluaciones, FilaAutoevaluacion } from '../../infrastructure/adapters/RepositorioBienestarPrisma';

export class ClientePrismaFalso implements ClienteAutoevaluaciones {
  readonly filas = new Map<string, FilaAutoevaluacion>();
  caido = false;
  private secuencia = 0;

  private fallarSiCaido() {
    if (this.caido) {
      throw Object.assign(new Error("Can't reach database server at localhost:5432"), { code: 'P1001' });
    }
  }

  autoevaluacionBienestar = {
    create: async ({ data }: { data: EvaluacionAnonima }): Promise<FilaAutoevaluacion> => {
      this.fallarSiCaido();
      this.secuencia += 1;
      const fila = { id: `db-${this.secuencia}`, ...data };
      this.filas.set(fila.id, fila);
      return { ...fila };
    },
    findFirst: async ({ where }: { where: { idAnonimoHash: string; idPartido: string } }): Promise<FilaAutoevaluacion | null> => {
      this.fallarSiCaido();
      const fila = [...this.filas.values()].find(
        (f) => f.idAnonimoHash === where.idAnonimoHash && f.idPartido === where.idPartido
      );
      return fila ? { ...fila } : null;
    },
    findUnique: async ({ where }: { where: { id: string } }): Promise<FilaAutoevaluacion | null> => {
      this.fallarSiCaido();
      const fila = this.filas.get(where.id);
      return fila ? { ...fila } : null;
    },
  };
}
