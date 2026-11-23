// src/core/ports/IValidadorPartido.ts
export interface IValidadorPartido {
  estaFinalizado(idPartido: string): Promise<boolean>;
}
