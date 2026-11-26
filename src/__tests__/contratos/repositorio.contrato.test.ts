// src/__tests__/contratos/repositorio.contrato.test.ts
// FPI-III-09 · El mismo conjunto de expectativas se aplica a las dos variantes del repositorio.
// Ejecutar: npx jest src/__tests__/contratos --verbose
import { EvaluacionAnonima } from '../../core/ports/IRepositorioBienestar';
import { DependenciaNoDisponibleError } from '../../core/errores';
import { RepositorioBienestarEnMemoria } from '../../infrastructure/adapters/RepositorioBienestarEnMemoria';
import { RepositorioBienestarPrisma } from '../../infrastructure/adapters/RepositorioBienestarPrisma';
import { ClientePrismaFalso } from '../dobles/ClientePrismaFalso';
import { evaluacionDeEjemplo, incumplimientosDelContrato, RepositorioCompleto } from './contratoRepositorio';

describe.each<[string, () => RepositorioCompleto]>([
  ['RepositorioBienestarEnMemoria', () => new RepositorioBienestarEnMemoria()],
  ['RepositorioBienestarPrisma (cliente falso)', () => new RepositorioBienestarPrisma(new ClientePrismaFalso())],
])('Contrato de persistencia · %s', (_nombre, crear) => {
  it('cumple las expectativas compartidas', async () => {
    await expect(incumplimientosDelContrato(crear())).resolves.toEqual([]);
  });
});

describe('RepositorioBienestarPrisma · comportamiento propio', () => {
  it('escribe en el cliente: después de guardar hay una fila con el hash y sin idEstudiante', async () => {
    const cliente = new ClientePrismaFalso();
    const id = await new RepositorioBienestarPrisma(cliente).guardarEvaluacion(evaluacionDeEjemplo());
    expect(id).toBe('db-1');
    expect(cliente.filas.size).toBe(1);
    expect(cliente.filas.get('db-1')).not.toHaveProperty('idEstudiante');
  });

  it('traduce P1001 (base inalcanzable) a DependenciaNoDisponibleError', async () => {
    const cliente = new ClientePrismaFalso();
    cliente.caido = true;
    const error = await new RepositorioBienestarPrisma(cliente)
      .guardarEvaluacion(evaluacionDeEjemplo())
      .catch((e) => e);
    expect(error).toBeInstanceOf(DependenciaNoDisponibleError);
    expect(error.causa.code).toBe('P1001');
    expect(cliente.filas.size).toBe(0);
  });

  it('no escribe en consola (el hash no termina en los logs)', async () => {
    const espia = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await new RepositorioBienestarPrisma(new ClientePrismaFalso()).guardarEvaluacion(evaluacionDeEjemplo());
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });
});

describe('Control negativo: el adaptador anterior no era sustituible', () => {
  // Reproduce la lógica de src/infrastructure/adapters/RepositorioBienestarPrisma.ts
  // hasta swiii/g08-modelo-dominio: ignora el cliente y declara éxito.
  class AdaptadorAnterior {
    constructor(private dbClient: ClientePrismaFalso) {}
    async guardarEvaluacion(_evaluacion: EvaluacionAnonima): Promise<string> {
      return `db-id-${Date.now()}`;
    }
    async buscarPorId(id: string) {
      const fila = await this.dbClient.autoevaluacionBienestar.findUnique({ where: { id } });
      return fila;
    }
  }

  it('declara éxito pero lo guardado no se puede recuperar', async () => {
    const fallas = await incumplimientosDelContrato(new AdaptadorAnterior(new ClientePrismaFalso()));
    expect(fallas).toContain('lo guardado se puede recuperar');
  });
});
