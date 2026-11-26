// src/infrastructure/adapters/RepositorioBienestarPrisma.ts
// Adaptador de persistencia para PostgreSQL vía Prisma (FPI-III-09).
//
// Antes: recibía `dbClient: any`, no lo usaba, devolvía `db-id-${Date.now()}` como si
// hubiera guardado y escribía el hash con console.log. Ahora:
//  - depende solo de la parte del cliente que usa (ClienteAutoevaluaciones), que
//    el PrismaClient real cumple y que en pruebas cumple un cliente falso;
//  - devuelve el id que asigna la base, así que no hay "éxito" sin escritura;
//  - traduce la falta de conexión a DependenciaNoDisponibleError;
//  - no escribe logs: registrar es responsabilidad del envoltorio de observabilidad.
import { EvaluacionAnonima, EvaluacionRegistrada, IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IConsultaEvaluaciones } from '../../core/ports/IConsultaEvaluaciones';
import { DependenciaNoDisponibleError } from '../../core/errores';

export interface FilaAutoevaluacion extends EvaluacionAnonima {
  id: string;
}

/** Subconjunto del PrismaClient que este adaptador necesita. */
export interface ClienteAutoevaluaciones {
  autoevaluacionBienestar: {
    create(args: { data: EvaluacionAnonima }): Promise<FilaAutoevaluacion>;
    findUnique(args: { where: { id: string } }): Promise<FilaAutoevaluacion | null>;
    findFirst(args: { where: { idAnonimoHash: string; idPartido: string } }): Promise<FilaAutoevaluacion | null>;
  };
}

// ECONNREFUSED: el driver no llega al puerto. P1001: código de Prisma "Can't reach database server".
const CODIGOS_SIN_CONEXION = new Set(['ECONNREFUSED', 'ETIMEDOUT', 'P1001']);

function esFaltaDeConexion(error: unknown): boolean {
  const codigo = (error as { code?: unknown } | null)?.code;
  return typeof codigo === 'string' && CODIGOS_SIN_CONEXION.has(codigo);
}

export class RepositorioBienestarPrisma implements IRepositorioBienestar, IConsultaEvaluaciones {
  constructor(private readonly cliente: ClienteAutoevaluaciones) {}

  async guardarEvaluacion(evaluacion: EvaluacionAnonima): Promise<string> {
    try {
      const fila = await this.cliente.autoevaluacionBienestar.create({ data: { ...evaluacion } });
      return fila.id;
    } catch (error) {
      if (esFaltaDeConexion(error)) throw new DependenciaNoDisponibleError('persistencia', error);
      throw error;
    }
  }

  async buscarPorEstudianteYPartido(idAnonimoHash: string, idPartido: string): Promise<EvaluacionRegistrada | null> {
    try {
      const fila = await this.cliente.autoevaluacionBienestar.findFirst({ where: { idAnonimoHash, idPartido } });
      if (!fila) return null;
      const { id, ...evaluacion } = fila;
      return { id, evaluacion };
    } catch (error) {
      if (esFaltaDeConexion(error)) throw new DependenciaNoDisponibleError('persistencia', error);
      throw error;
    }
  }

  async buscarPorId(id: string): Promise<EvaluacionAnonima | null> {
    try {
      const fila = await this.cliente.autoevaluacionBienestar.findUnique({ where: { id } });
      if (!fila) return null;
      const { id: _id, ...evaluacion } = fila;
      void _id;
      return evaluacion;
    } catch (error) {
      if (esFaltaDeConexion(error)) throw new DependenciaNoDisponibleError('persistencia', error);
      throw error;
    }
  }
}
