// src/infrastructure/adapters/RepositorioBienestarPrisma.ts
import { IRepositorioBienestar, EvaluacionAnonima } from '../../core/ports/IRepositorioBienestar';

// En un proyecto real, aquí importarías { PrismaClient } from '@prisma/client'
// Para el MVP, simulamos la interfaz del cliente para que el archivo compile sin instalar Prisma aún.
export class RepositorioBienestarPrisma implements IRepositorioBienestar {
  constructor(private dbClient: any) {}

  async guardarEvaluacion(evaluacion: EvaluacionAnonima): Promise<string> {
    // Aquí iría: this.dbClient.autoevaluacionBienestar.create({ data: evaluacion })
    // Simulamos el ID retornado por la BD
    const idGenerado = `db-id-${Date.now()}`;
    console.log(`[Adapter] Evaluación guardada con hash: ${evaluacion.idAnonimoHash}`);
    return idGenerado;
  }
}
