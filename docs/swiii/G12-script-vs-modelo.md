# FPI-III-12 · Transaction Script frente a Domain Model

Rama: `swiii/g12-script-vs-modelo` (parte de `swiii/g11-dominio-unicidad`).

| Paso | Commit | Qué cambió |
|---|---|---|
| 1. Versión script y casos comunes | `c6c4450` | `src/core/bienestar/registrarEvaluacionScript.ts`, `src/__tests__/comparacion/registrarEvaluacion.comparacion.test.ts` |
| 2. Parte común del cambio H-02 | `546527b` | Puerto `IValidadorPartido.consultarEstado`, adaptador, `PartidoNoEncontradoError`, 404 en HTTP, dobles |
| 3. Regla H-02 en el script | `1d174bc` | 1 archivo, +2 líneas |
| 4. Regla H-02 en el Domain Model | `2547b56` | 1 archivo, +9 / −1 |
| 5. Pruebas y documentos | este commit | Caso H-02 en la comparación, 404 por HTTP, prueba afectada del Domain Model, ERS v1.2, matriz v1.2, ADR-17 |

Resultado del caso H-02 en la comparación: después del paso 2 fallaba en las dos versiones; después del
paso 3 solo fallaba en Domain Model; después del paso 4 pasa en ambas (10 de 10).

Decisión: `docs/adr/ADR-17-domain-model-registro-evaluacion.md`.
