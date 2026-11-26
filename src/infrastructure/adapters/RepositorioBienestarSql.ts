// src/infrastructure/adapters/RepositorioBienestarSql.ts
// Data Mapper (FPI-III-14): traduce entre EvaluacionAnonima (camelCase, Date) y la fila de
// autoevaluacion_bienestar (snake_case, TIMESTAMPTZ). El dominio no conoce la tabla ni SQL.
//
// Frontera transaccional: cada escritura es una sola sentencia INSERT con autocommit. La
// unicidad (RF-03) la garantiza la restricción uq_evaluacion_estudiante_partido; si otra
// petición ganó la carrera, el INSERT no devuelve fila y se informa RegistroConcurrenteError
// para que el servicio aplique la regla del agregado con lo que quedó guardado.
import { EvaluacionAnonima, EvaluacionRegistrada, IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IConsultaEvaluaciones } from '../../core/ports/IConsultaEvaluaciones';
import { DependenciaNoDisponibleError, RegistroConcurrenteError } from '../../core/errores';
import { ClienteSql } from '../persistencia/ClienteSql';

interface FilaEvaluacion {
  id_evaluacion: string | number;
  id_anonimo_hash: string;
  id_partido: string;
  escala_fisica: number;
  escala_mental: number;
  fecha_registro: Date | string;
}

const COLUMNAS = 'id_evaluacion, id_anonimo_hash, id_partido, escala_fisica, escala_mental, fecha_registro';
const CODIGOS_SIN_CONEXION = new Set(['ECONNREFUSED', 'ETIMEDOUT', '57P01', '08006', '08001']);

function aDominio(fila: FilaEvaluacion): EvaluacionRegistrada {
  return {
    id: String(fila.id_evaluacion),
    evaluacion: {
      idAnonimoHash: fila.id_anonimo_hash,
      idPartido: fila.id_partido,
      escalaFisica: Number(fila.escala_fisica),
      escalaMental: Number(fila.escala_mental),
      fechaRegistro: new Date(fila.fecha_registro),
    },
  };
}

export class RepositorioBienestarSql implements IRepositorioBienestar, IConsultaEvaluaciones {
  constructor(private readonly cliente: ClienteSql) {}

  async guardarEvaluacion(e: EvaluacionAnonima): Promise<string> {
    const { rows } = await this.ejecutar<{ id_evaluacion: string | number }>(
      `INSERT INTO autoevaluacion_bienestar (id_anonimo_hash, id_partido, escala_fisica, escala_mental, fecha_registro)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT ON CONSTRAINT uq_evaluacion_estudiante_partido DO NOTHING
       RETURNING id_evaluacion`,
      [e.idAnonimoHash, e.idPartido, e.escalaFisica, e.escalaMental, e.fechaRegistro]
    );
    if (rows.length === 0) throw new RegistroConcurrenteError();
    return String(rows[0].id_evaluacion);
  }

  async buscarPorEstudianteYPartido(idAnonimoHash: string, idPartido: string): Promise<EvaluacionRegistrada | null> {
    const { rows } = await this.ejecutar<FilaEvaluacion>(
      `SELECT ${COLUMNAS} FROM autoevaluacion_bienestar WHERE id_anonimo_hash = $1 AND id_partido = $2`,
      [idAnonimoHash, idPartido]
    );
    return rows[0] ? aDominio(rows[0]) : null;
  }

  async buscarPorId(id: string): Promise<EvaluacionAnonima | null> {
    if (!/^\d+$/.test(id)) return null;
    const { rows } = await this.ejecutar<FilaEvaluacion>(
      `SELECT ${COLUMNAS} FROM autoevaluacion_bienestar WHERE id_evaluacion = $1`,
      [id]
    );
    return rows[0] ? aDominio(rows[0]).evaluacion : null;
  }

  private async ejecutar<T>(sql: string, parametros: unknown[]) {
    try {
      return await this.cliente.query<T>(sql, parametros);
    } catch (error) {
      const codigo = (error as { code?: unknown } | null)?.code;
      if (typeof codigo === 'string' && CODIGOS_SIN_CONEXION.has(codigo)) {
        throw new DependenciaNoDisponibleError('persistencia', error);
      }
      throw error;
    }
  }
}
