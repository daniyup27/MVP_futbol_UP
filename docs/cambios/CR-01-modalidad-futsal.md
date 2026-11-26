# CR-01 · Incorporar la modalidad de fútbol sala (FUTSAL)

| Campo | Valor |
|---|---|
| Solicitante | Dependencia de Bienestar (torneo intersemestral en cancha cubierta) |
| Fecha de registro | 2026-11-21 |
| Línea base afectada | `swiii-linea-base` (c4de7e2) + ADR-16 |
| Responsable | Product Owner / desarrolladora (equipo de 1) |
| Aprobador propuesto | Docente de Ingeniería de Software III (revisión de PR) y coordinación de Bienestar (valores de reglamento) |
| Estado | Incremento 1 implementado en rama; incremento 2 pendiente de aprobación |

## Análisis de impacto

| Elemento | Impacto | Costo de revertir |
|---|---|---|
| RF-01 validar cantidad de jugadores | Nueva modalidad 5–12 | Bajo (configuración) |
| `tournament.config.ts` | Nueva entrada FUTSAL | Bajo |
| `torneos/reglasTorneo.ts` (Strategy) | Ninguno: registro automático | — |
| `docs/api/openapi.yaml` | Enum de `tipoTorneo` (incremento 2) | Medio: contrato público |
| Evaluaciones de bienestar | Ninguno: el hash (ADR-16) no depende del torneo | — |
| Pruebas | Extensión + ajuste de la prueba de tipo desconocido | Bajo |

## Matriz requisito · diseño · prueba

| Requisito | Elemento de diseño | Prueba | Estado |
|---|---|---|---|
| RF-01 (TRADITIONAL, WELLBEING) | `ReglasTorneo` / `reglasPorRango` | `caracterizacion.torneos.test.ts` | Aprobada |
| RF-01 + CR-01 (FUTSAL) | Entrada FUTSAL en `tournament.config` | `extension.reglasTorneo.test.ts` | Aprobada |
| RF-01 + CR-01 contrato | `openapi.yaml` enum tipoTorneo | Prueba de contrato (incremento 2) | Planificada |
| RF-02 evaluación anónima | `ServicioBienestar` + `anonimizar` (ADR-16) | `bienestar.integration.test.ts` | Aprobada |
| AQ-01 sin PII | ADR-16, logger con redacción | `anonimizar.test.ts`, integración | Aprobada |

## Incrementos

1. **Incremento 1 (hecho):** reglas FUTSAL en dominio. Criterio: 5 y 12 aceptados, 13 rechazado, consumidores sin cambios.
   Riesgo que reduce: modelar mal la variación de reglas.
2. **Incremento 2 (pendiente):** exponer FUTSAL en el contrato OpenAPI y en el formulario de inscripción con los
   valores confirmados por Bienestar. Criterio: prueba de contrato y demostración con una inscripción sintética.
   Riesgo que reduce: publicar valores de reglamento no validados.

## Decisión de método

Híbrido: el cambio de reglas se trabaja de forma evolutiva (reversible, retroalimentación en el PR); todo lo que
toque el contrato público o la seudonimización (ADR-16) pasa por registro de cambio y aprobación antes del merge.
