// src/__tests__/arquitectura/capas.test.ts
// FPI-III-05 · Comprobación repetible de la regla de dependencias.
// Ejecutar: npx jest src/__tests__/arquitectura
import * as path from 'path';
import {
  leerDependencias,
  violaciones,
  capaDeArchivo,
  lecturasDeEntornoDesdeNucleo,
  importacionesFueraDelDominio,
} from './reglasDependencia';

const RAIZ = path.resolve(__dirname, '../../..');

describe('Regla de dependencias entre capas', () => {
  const deps = leerDependencias(RAIZ);

  it('encuentra las importaciones reales del código (la regla no pasa por estar vacía)', () => {
    expect(deps.length).toBeGreaterThan(0);
    expect(deps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          origen: 'src/core/ServicioBienestar.ts',
          destino: 'src/core/ports/IRepositorioBienestar.ts',
        }),
      ])
    );
  });

  it('el núcleo no depende de infraestructura, presentación ni de sus paquetes', () => {
    expect(violaciones(deps)).toEqual([]);
  });

  it('el núcleo no lee variables de entorno ni importa módulos que las lean (FPI-III-07)', () => {
    expect(lecturasDeEntornoDesdeNucleo(RAIZ, deps)).toEqual([]);
  });

  it('el modelo de dominio solo depende de sí mismo, de los errores y de los puertos (FPI-III-13)', () => {
    expect(importacionesFueraDelDominio(deps)).toEqual([]);
    expect(deps.some((d) => d.origen.startsWith('src/core/dominio/'))).toBe(true);
  });

  it('la regla detecta un cruce si aparece (control negativo)', () => {
    const cruce = violaciones([
      {
        origen: 'src/core/Ejemplo.ts',
        destino: 'pino',
        capaOrigen: 'nucleo',
        capaDestino: 'externo',
      },
      {
        origen: 'src/core/Ejemplo.ts',
        destino: 'src/infrastructure/adapters/RepositorioBienestarPrisma.ts',
        capaOrigen: 'nucleo',
        capaDestino: 'infraestructura',
      },
    ]);
    expect(cruce).toHaveLength(2);
  });

  it('clasifica cada carpeta en su capa', () => {
    expect(capaDeArchivo('src/app/api/health/route.ts')).toBe('presentacion');
    expect(capaDeArchivo('src/core/validarCantidadJugadores.ts')).toBe('nucleo');
    expect(capaDeArchivo('src/infrastructure/observabilidad/logger.ts')).toBe('infraestructura');
    expect(capaDeArchivo('src/utils/anonimizar.ts')).toBe('transversal');
  });
});
