# RD-01 · Revisión de diseño del módulo de Bienestar

| Campo | Valor |
|---|---|
| Fecha | 2026-11-25 |
| Material revisado | ERS v1.0, `matriz-trazabilidad.json` v1.0 (RF-01, RF-02, AQ-01), D-02 y el código de `swiii/g09-contrato-repositorio` (`3f2cab6`) |
| Autora | Stefanny Fajardo |
| Revisión | Simulada: la autora asume el rol de equipo revisor con la lista de chequeo de abajo (el equipo es de una persona) |
| Lista de chequeo | ¿Cada requisito tiene componente, contrato y prueba? ¿El diseño de Software II está en el código? ¿Hay escenarios del Taller sin requisito? |

## Hallazgos

| ID | Hallazgo | Severidad | Evidencia | Decisión | Responsable | Cierre |
|---|---|---|---|---|---|---|
| H-01 | El diseño de Software II pide unicidad (`validarUnicidad()`, restricción UNIQUE) y no existe requisito ni código: el mismo estudiante registra varias evaluaciones del mismo partido | Alta | Ejecución sobre `3f2cab6`: `mem-1`, `mem-2`, `mem-3` para el mismo hash y partido | Origina **CR-03**, aceptado | Product Owner | Cuando CP-03 esté en verde (FPI-III-11) |
| H-02 | Un partido inexistente responde `PARTIDO_NO_FINALIZADO`, aunque el Taller (Tabla 4) lo trata como escenario aparte con error descriptivo | Media | `registrarEvaluacion(..., 'no-existe', 4, 3)` → `PARTIDO_NO_FINALIZADO` | Aceptado; se implementa como cambio de regla en FPI-III-12 | Product Owner | Cuando exista una prueba que distinga los dos casos |

## Observaciones sin cambio
- La matriz v1.0 pasa la verificación automática (`trazabilidad.test.ts`).
- AQ-02 (healthcheck) no entra en esta versión: el CD está roto (FPI-III-02) y no hay prueba que lo cubra.
