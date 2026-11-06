// src/__tests__/integration/bienestar.integration.test.ts
/**
 * Pruebas de integración del módulo de bienestar.
 * 
 * Estrategia de aislamiento (ADR-07):
 * - El núcleo de dominio (ServicioBienestar) se ejecuta REAL para verificar
 *   que genera el UUID v4 correctamente (Ley 1581).
 * - Los puertos de entrada/salida se mockean (IValidadorPartido, IRepositorioBienestar).
 * - NO se usa la base de datos de desarrollo real.
 * - NO se mockea el núcleo de negocio (eso sería probar nada).
 */

import { ServicioBienestar } from '../../core/ServicioBienestar';
import { IRepositorioBienestar, EvaluacionAnonima } from '../../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../../core/ports/IValidadorPartido';

// Mock del repositorio (Stub simple)
// Simula el adaptador de Prisma sin tocar la BD real
const mockRepositorio: IRepositorioBienestar = {
  guardarEvaluacion: jest.fn().mockImplementation(async (evaluacion: EvaluacionAnonima) => {
    // Simula el comportamiento del adaptador Prisma:
    // - Acepta la evaluación anonimada
    // - Retorna un ID de base de datos ficticio
    return `db-id-${Date.now()}`;
  }),
};

// Mock del validador de partido (Stub)
const mockValidador: IValidadorPartido = {
  estaFinalizado: jest.fn().mockImplementation(async (idPartido: string) => {
    // Simula la lógica de negocio: solo partidos finalizados pueden evaluarse
    return idPartido === 'partido-finalizado';
  }),
};

describe('Integración: Módulo de Bienestar (ADR-07)', () => {
  let servicio: ServicioBienestar;

  beforeEach(() => {
    // Reinicia los mocks antes de cada prueba
    jest.clearAllMocks();
    servicio = new ServicioBienestar(mockRepositorio, mockValidador);
  });

  describe('POST /bienestar/evaluaciones - Flujo completo', () => {
    it('debe registrar la evaluación y retornar SOLO el hash anónimo (Ley 1581)', async () => {
      // Arrange: Datos de entrada (el idEstudiante NUNCA debe llegar al repositorio)
      const idEstudiante = 'estudiante-123';
      const idTorneo = 'torneo-456';
      const idPartido = 'partido-finalizado';
      const escalaFisica = 4;
      const escalaMental = 3;

      // Act: Ejecuta el flujo completo del núcleo
      const resultado = await servicio.registrarEvaluacion(
        idEstudiante,
        idTorneo,
        idPartido,
        escalaFisica,
        escalaMental
      );

      // Assert: Verifica que el repositorio recibió una evaluación ANONIMADA
      expect(mockRepositorio.guardarEvaluacion).toHaveBeenCalledTimes(1);

      const evaluacionEnviada = (mockRepositorio.guardarEvaluacion as jest.Mock).mock.calls[0][0];

      // ASSERT CRÍTICO DE PRIVACIDAD (Ley 1581):
      // El hash debe ser un UUID v4 válido
      expect(evaluacionEnviada.idAnonimoHash).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );

      // ASSERT NEGATIVO: NUNCA debe enviarse el idEstudiante al repositorio
      expect(evaluacionEnviada).not.toHaveProperty('idEstudiante');
      expect(evaluacionEnviada).not.toHaveProperty('cedula');
      expect(evaluacionEnviada).not.toHaveProperty('nombre');

      // Los datos de la evaluación deben preservarse
      expect(evaluacionEnviada.escalaFisica).toBe(escalaFisica);
      expect(evaluacionEnviada.escalaMental).toBe(escalaMental);
      expect(evaluacionEnviada.idPartido).toBe(idPartido);

      // El resultado debe ser un ID de base de datos
      expect(resultado).toMatch(/^db-id-/);
    });

    it('debe rechazar evaluación de partido no finalizado', async () => {
      // Arrange
      const idPartidoNoFinalizado = 'partido-en-curso';

      // Act & Assert
      await expect(
        servicio.registrarEvaluacion(
          'est-1',
          'tor-1',
          idPartidoNoFinalizado,
          4,
          3
        )
      ).rejects.toThrow('No se puede evaluar un partido no finalizado');

      // Verificar que NUNCA se llamó al repositorio (defensa en profundidad)
      expect(mockRepositorio.guardarEvaluacion).not.toHaveBeenCalled();
    });

    it('debe generar hashes únicos para cada evaluación (anti-colisión)', async () => {
      // Arrange: Mismo estudiante, mismo torneo, pero diferentes evaluaciones
      const hashesGenerados = new Set<string>();

      // Act: Genera 10 hashes
      for (let i = 0; i < 10; i++) {
        await servicio.registrarEvaluacion(
          'estudiante-fijo',
          'torneo-fijo',
          'partido-finalizado',
          4,
          3
        );

        const evaluacionEnviada = (mockRepositorio.guardarEvaluacion as jest.Mock).mock.calls[i][0];
        hashesGenerados.add(evaluacionEnviada.idAnonimoHash);
      }

      // Assert: Los 10 hashes deben ser únicos (UUID v4 criptográficamente seguro)
      expect(hashesGenerados.size).toBe(10);
    });
  });
});
