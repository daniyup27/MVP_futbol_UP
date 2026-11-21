// src/__tests__/integration/bienestar.integration.test.ts
/**
 * Pruebas de integración del módulo de bienestar.
 * 
 * Estrategia de aislamiento (ADR-07):
 * - El núcleo de dominio (ServicioBienestar) y la seudonimización se ejecutan
 *   REALES para verificar el idAnonimoHash HMAC-SHA256 (Ley 1581, ADR-16).
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

      // ASSERT CRÍTICO DE PRIVACIDAD (Ley 1581, ADR-16):
      // El hash es HMAC-SHA256 en hexadecimal (64 caracteres) y no contiene el id
      expect(evaluacionEnviada.idAnonimoHash).toMatch(/^[0-9a-f]{64}$/);
      expect(evaluacionEnviada.idAnonimoHash).not.toContain(idEstudiante);

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

    it('debe producir el mismo hash para el mismo estudiante y distinto para otro (ADR-16)', async () => {
      // Act: dos evaluaciones del mismo estudiante y una de otro estudiante
      await servicio.registrarEvaluacion('estudiante-A', 'torneo-1', 'partido-finalizado', 4, 3);
      await servicio.registrarEvaluacion('estudiante-A', 'torneo-2', 'partido-finalizado', 2, 5);
      await servicio.registrarEvaluacion('estudiante-B', 'torneo-1', 'partido-finalizado', 4, 3);

      const llamadas = (mockRepositorio.guardarEvaluacion as jest.Mock).mock.calls;
      const [hashA1, hashA2, hashB] = llamadas.map((c) => c[0].idAnonimoHash);

      // Assert: determinista por estudiante (seguimiento longitudinal) y sin colisión entre estudiantes
      expect(hashA1).toBe(hashA2);
      expect(hashA1).not.toBe(hashB);
    });
  });
});
