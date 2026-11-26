// src/__tests__/comparacion/registrarEvaluacion.comparacion.test.ts
// FPI-III-12 · Los mismos casos, con el mismo estado inicial y los mismos resultados esperados,
// se ejecutan contra las dos versiones del flujo: Domain Model y Transaction Script.
// Ejecutar: npx jest src/__tests__/comparacion --verbose
import { ServicioBienestar } from '../../core/ServicioBienestar';
import { registrarEvaluacionScript } from '../../core/bienestar/registrarEvaluacionScript';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { AnonimizadorDePrueba } from '../dobles/AnonimizadorDePrueba';

type Registrar = (idEstudiante: string, idPartido: string, ef: number, em: number) => Promise<string>;

function estadoInicial() {
  const finalizado = Partido.programado('partido-7');
  finalizado.finalizar(2, 1);
  const programado = Partido.programado('partido-8');
  return {
    repositorio: new RepositorioBienestarEnMemoria(),
    validador: new ValidadorPartidoEnMemoria([finalizado, programado]),
    anonimizador: new AnonimizadorDePrueba(),
  };
}

const versiones: [string, (deps: ReturnType<typeof estadoInicial>) => Registrar][] = [
  ['Domain Model (ServicioBienestar + entidades)', (d) => {
    const s = new ServicioBienestar(d.repositorio, d.validador, d.anonimizador);
    return (e, p, ef, em) => s.registrarEvaluacion(e, 't', p, ef, em);
  }],
  ['Transaction Script (registrarEvaluacionScript)', (d) => (e, p, ef, em) => registrarEvaluacionScript(d, e, p, ef, em)],
];

describe.each(versiones)('%s', (_nombre, crear) => {
  it('caso 1 · éxito: partido finalizado y escalas 4/3 → un registro', async () => {
    const d = estadoInicial();
    await expect(crear(d)('estudiante-A', 'partido-7', 4, 3)).resolves.toBe('mem-1');
    expect(d.repositorio.listar()).toHaveLength(1);
  });

  it('caso 2 · partido programado → PARTIDO_NO_FINALIZADO y 0 registros', async () => {
    const d = estadoInicial();
    await expect(crear(d)('estudiante-A', 'partido-8', 4, 3)).rejects.toMatchObject({ codigo: 'PARTIDO_NO_FINALIZADO' });
    expect(d.repositorio.listar()).toHaveLength(0);
  });

  it('caso 3 · escala 6 → DATOS_INVALIDOS y 0 registros', async () => {
    const d = estadoInicial();
    await expect(crear(d)('estudiante-A', 'partido-7', 6, 3)).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
    expect(d.repositorio.listar()).toHaveLength(0);
  });

  it('cambio H-02 · partido inexistente → PARTIDO_NO_ENCONTRADO y 0 registros', async () => {
    const d = estadoInicial();
    await expect(crear(d)('estudiante-A', 'no-existe', 4, 3)).rejects.toMatchObject({ codigo: 'PARTIDO_NO_ENCONTRADO' });
    expect(d.repositorio.listar()).toHaveLength(0);
  });

  it('control RF-03 · reintento igual devuelve el mismo id; distinto → EVALUACION_YA_REGISTRADA', async () => {
    const d = estadoInicial();
    const registrar = crear(d);
    const id = await registrar('estudiante-A', 'partido-7', 4, 3);
    await expect(registrar('estudiante-A', 'partido-7', 4, 3)).resolves.toBe(id);
    await expect(registrar('estudiante-A', 'partido-7', 1, 1)).rejects.toMatchObject({ codigo: 'EVALUACION_YA_REGISTRADA' });
    expect(d.repositorio.listar()).toHaveLength(1);
  });
});
