// src/core/__tests__/ServicioBienestar.test.ts
import { ServicioBienestar } from '../ServicioBienestar';
import { IRepositorioBienestar } from '../ports/IRepositorioBienestar';
import { IValidadorPartido } from '../ports/IValidadorPartido';
import { AnonimizadorDePrueba } from '../../__tests__/dobles/AnonimizadorDePrueba';

// Mock del repositorio (Stub simple)
const mockRepositorio: IRepositorioBienestar = {
  guardarEvaluacion: async () => 'id-evaluacion-123',
};

// Mock del validador
const mockValidador: IValidadorPartido = {
  estaFinalizado: async (id: string) => id === 'partido-finalizado',
};

// FPI-III-07: antes se usaba jest.mock con un hash constante ('a' x 64), que no cumple
// el contrato de IAnonimizador. Ahora se inyecta un doble que sí lo cumple.
const anonimizador = new AnonimizadorDePrueba();

describe('ServicioBienestar (Núcleo Hexagonal)', () => {
  it('debe anonimizar el id y guardar si el partido está finalizado', async () => {
    const servicio = new ServicioBienestar(mockRepositorio, mockValidador, anonimizador);
    
    const resultado = await servicio.registrarEvaluacion(
      'estudiante-123', // Este dato NUNCA debe llegar al repositorio
      'torneo-456',
      'partido-finalizado',
      4,
      3
    );

    expect(resultado).toBe('id-evaluacion-123');
  });

  it('debe rechazar evaluación de partido no finalizado', async () => {
    const servicio = new ServicioBienestar(mockRepositorio, mockValidador, anonimizador);

    await expect(
      servicio.registrarEvaluacion('est-1', 'tor-1', 'partido-no-finalizado', 4, 3)
    ).rejects.toThrow('No se puede evaluar un partido no finalizado');
  });
});

describe('ServicioBienestar · escalas (FPI-III-06)', () => {
  const servicio = new ServicioBienestar(mockRepositorio, mockValidador, anonimizador);
  it.each([1, 5])('acepta la escala límite %i', async (valor) => {
    await expect(
      servicio.registrarEvaluacion('est-1', 'tor-1', 'partido-finalizado', valor, valor)
    ).resolves.toBe('id-evaluacion-123');
  });
  it.each([0, 6, 3.5])('rechaza la escala %p como dato inválido', async (valor) => {
    await expect(
      servicio.registrarEvaluacion('est-1', 'tor-1', 'partido-finalizado', valor, 3)
    ).rejects.toMatchObject({ codigo: 'DATOS_INVALIDOS' });
  });
});
