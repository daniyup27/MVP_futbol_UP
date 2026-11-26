// src/core/dominio/EscalaBienestar.ts
// Objeto de valor (FPI-III-08). Representa una respuesta de la autoevaluación
// física o mental. Se compara por su valor, no cambia después de creado y no
// puede existir fuera del rango definido en el contrato (enteros de 1 a 5).
import { DatosEvaluacionInvalidosError } from '../errores';

export class EscalaBienestar {
  static readonly MINIMO = 1;
  static readonly MAXIMO = 5;

  private constructor(readonly valor: number) {
    Object.freeze(this);
  }

  static crear(valor: number, nombre = 'escala'): EscalaBienestar {
    if (!Number.isInteger(valor) || valor < EscalaBienestar.MINIMO || valor > EscalaBienestar.MAXIMO) {
      throw new DatosEvaluacionInvalidosError(
        `${nombre} debe ser un entero entre ${EscalaBienestar.MINIMO} y ${EscalaBienestar.MAXIMO}`
      );
    }
    return new EscalaBienestar(valor);
  }

  equals(otra: EscalaBienestar): boolean {
    return this.valor === otra.valor;
  }
}
