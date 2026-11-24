// src/infrastructure/adapters/RepositorioBienestarEnMemoria.ts
// Implementación del puerto IRepositorioBienestar que guarda en un Map.
// Sirve para el ejemplo ejecutable y para comprobar el estado de datos en pruebas
// sin tocar PostgreSQL (ADR-07). No es para producción: se pierde al reiniciar.
import { EvaluacionAnonima, IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';

export class RepositorioBienestarEnMemoria implements IRepositorioBienestar {
  private readonly registros = new Map<string, EvaluacionAnonima>();
  private secuencia = 0;

  async guardarEvaluacion(evaluacion: EvaluacionAnonima): Promise<string> {
    this.secuencia += 1;
    const id = `mem-${this.secuencia}`;
    this.registros.set(id, { ...evaluacion });
    return id;
  }

  /** Solo lectura, para verificar el estado persistido. */
  listar(): ReadonlyArray<{ id: string; evaluacion: EvaluacionAnonima }> {
    return [...this.registros.entries()].map(([id, evaluacion]) => ({ id, evaluacion: { ...evaluacion } }));
  }
}
