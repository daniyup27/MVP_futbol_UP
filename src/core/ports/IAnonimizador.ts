// src/core/ports/IAnonimizador.ts
// Puerto de seudonimización expresado desde lo que necesita el caso de uso (FPI-III-07).
// Corresponde a la interfaz IAnonimizador del diagrama de clases refactorizado de
// Software II, que hasta ahora no existía en el código.
//
// Contrato que debe cumplir toda implementación (ver src/__tests__/contratos):
//  1. Determinista: el mismo identificador produce siempre el mismo resultado (ADR-16).
//  2. Distinto por estudiante: identificadores distintos producen resultados distintos.
//  3. Formato: 64 caracteres hexadecimales en minúscula.
//  4. No contiene el identificador original.
//  5. Rechaza un identificador vacío lanzando un error.
export interface IAnonimizador {
  generarHash(idEstudiante: string): string;
}
