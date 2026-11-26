// src/__tests__/contratos/contratoAnonimizador.ts
// Comprobaciones del contrato de IAnonimizador, reutilizables con cualquier implementación.
import { IAnonimizador } from '../../core/ports/IAnonimizador';

export function incumplimientosDelContrato(impl: IAnonimizador): string[] {
  const fallas: string[] = [];
  const a1 = impl.generarHash('estudiante-A');
  const a2 = impl.generarHash('estudiante-A');
  const b = impl.generarHash('estudiante-B');
  if (a1 !== a2) fallas.push('determinista');
  if (a1 === b) fallas.push('distinto por estudiante');
  if (!/^[0-9a-f]{64}$/.test(a1)) fallas.push('formato 64 hex');
  if (a1.includes('estudiante-A')) fallas.push('no contiene el identificador');
  let rechazaVacio = false;
  try {
    impl.generarHash('');
  } catch {
    rechazaVacio = true;
  }
  if (!rechazaVacio) fallas.push('rechaza identificador vacío');
  return fallas;
}
