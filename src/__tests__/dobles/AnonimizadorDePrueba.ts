// src/__tests__/dobles/AnonimizadorDePrueba.ts
// Doble de prueba de IAnonimizador: asigna un valor hexadecimal secuencial a cada
// identificador nuevo y repite el mismo valor si el identificador vuelve a llegar.
// No usa secreto ni criptografía, pero cumple el mismo contrato que AnonimizadorHmac.
import { IAnonimizador } from '../../core/ports/IAnonimizador';

export class AnonimizadorDePrueba implements IAnonimizador {
  private readonly asignados = new Map<string, string>();

  generarHash(idEstudiante: string): string {
    if (!idEstudiante) throw new Error('El identificador debe ser un string válido');
    let valor = this.asignados.get(idEstudiante);
    if (!valor) {
      valor = (this.asignados.size + 1).toString(16).padStart(64, 'f');
      this.asignados.set(idEstudiante, valor);
    }
    return valor;
  }
}
