# FPI-III-01 · Línea base y recorrido mínimo repetible

## Versión de partida

- Tag: `swiii-linea-base` → commit `c4de7e2` (merge del PR #30, 2026-11-07).

## Recorrido mínimo (sin base de datos ni servidor)

El repositorio no contiene aún `next`, `prisma` ni un script `build`, por lo que el recorrido
repetible disponible es la suite de dominio:

```bash
git checkout swiii-linea-base
npm install
npx jest
```

| Versión | Resultado observado |
|---|---|
| `swiii-linea-base` | 3 suites fallan al compilar, 0 pruebas ejecutadas |
| rama `swiii/g01-linea-base` | 4 suites, 14 pruebas aprobadas |

Causas en la línea base:

1. Archivos creados en rutas anidadas (`src/core/ports/src/core/ports/...`), imports sin resolver.
2. `ServicioBienestar` importaba `../utils/anonimizacion`, inexistente.
3. Prueba con `'FUTSAL'` fuera del tipo `TipoTorneo` (error TS2345).
4. Contradicción UUID v4 vs SHA-256 → ver ADR-16.

Datos de prueba: identificadores sintéticos (`estudiante-A`, `1090000000`); secreto sintético en `jest.setup.ts`.
