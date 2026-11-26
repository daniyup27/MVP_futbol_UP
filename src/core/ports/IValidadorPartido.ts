// src/core/ports/IValidadorPartido.ts
// FPI-III-12 (H-02): el puerto distingue un partido inexistente de uno que no ha terminado.
export type EstadoConsultaPartido = 'NO_EXISTE' | 'PROGRAMADO' | 'FINALIZADO';

export interface IValidadorPartido {
  consultarEstado(idPartido: string): Promise<EstadoConsultaPartido>;
}
