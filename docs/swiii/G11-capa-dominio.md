# FPI-III-11 · Capa de dominio del contexto de Bienestar

Rama: `swiii/g11-dominio-unicidad` (parte de `swiii/g10-requisitos-trazabilidad`).

- Glosario: `docs/dominio/glosario.md`
- Catálogo de reglas: `docs/dominio/catalogo-reglas.md`
- Modelo y límites de consistencia: `docs/diagramas/modelo-dominio-g11.mmd`
- Implementación de CR-03 (RF-03): agregado `src/core/dominio/RegistroEvaluacionPartido.ts`,
  `AutoevaluacionBienestar.mismasRespuestas`, `IRepositorioBienestar.buscarPorEstudianteYPartido`
- Pruebas CP-03: `RegistroEvaluacionPartido.test.ts` y `unicidadEvaluacion.test.ts`
- Matriz de trazabilidad v1.1: RF-03 pasa de `pendiente` a `verificado`

Pendiente declarado: la atomicidad bajo peticiones simultáneas se prueba con la restricción UNIQUE
cuando exista una base real (FPI-III-14).
