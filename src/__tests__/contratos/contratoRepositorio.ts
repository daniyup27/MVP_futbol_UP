// src/__tests__/contratos/contratoRepositorio.ts
// Expectativas del contrato de persistencia de evaluaciones (FPI-III-09).
// Toda implementación de IRepositorioBienestar + IConsultaEvaluaciones debe cumplirlas.
import { EvaluacionAnonima, IRepositorioBienestar } from '../../core/ports/IRepositorioBienestar';
import { IConsultaEvaluaciones } from '../../core/ports/IConsultaEvaluaciones';

export type RepositorioCompleto = IRepositorioBienestar & IConsultaEvaluaciones;

export const evaluacionDeEjemplo = (idPartido = 'partido-7'): EvaluacionAnonima => ({
  idAnonimoHash: 'f'.repeat(64),
  idPartido,
  escalaFisica: 4,
  escalaMental: 3,
  fechaRegistro: new Date('2026-11-24T15:00:00Z'),
});

export async function incumplimientosDelContrato(repo: RepositorioCompleto): Promise<string[]> {
  const fallas: string[] = [];
  const original = evaluacionDeEjemplo();
  const id1 = await repo.guardarEvaluacion(original);
  const id2 = await repo.guardarEvaluacion(evaluacionDeEjemplo('partido-8'));
  if (typeof id1 !== 'string' || id1.trim() === '') fallas.push('devuelve un id no vacío');
  if (id1 === id2) fallas.push('ids distintos por registro');
  const recuperada = await repo.buscarPorId(id1);
  if (!recuperada) {
    fallas.push('lo guardado se puede recuperar');
  } else {
    if (JSON.stringify(recuperada) !== JSON.stringify(original)) fallas.push('se recupera sin cambios');
    if ('idEstudiante' in recuperada) fallas.push('no agrega datos personales');
  }
  if ((await repo.buscarPorId('no-existe')) !== null) fallas.push('id inexistente devuelve null');
  return fallas;
}
