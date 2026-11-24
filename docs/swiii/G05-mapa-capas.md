# FPI-III-05 · Mapa de capas y regla de dependencias

Flujo trabajado: **registrar autoevaluación de bienestar** (`POST /bienestar/evaluaciones`).
Rama: `swiii/g05-capas`, parte de `swiii/g04-control-cambio` (`ab0713f`).

## Capas del MVP y carpetas

| Capa | Carpetas | Responsabilidad |
|---|---|---|
| Presentación | `src/app/`, `src/presentation/` | Recibe la petición, valida forma, traduce resultados a HTTP |
| Núcleo (aplicación + dominio) | `src/core/`, `src/config/` | Casos de uso (`ServicioBienestar`), reglas (`validarCantidadJugadores`, `reglasTorneo`) y puertos |
| Infraestructura | `src/infrastructure/`, `src/telemetry/` | Adaptadores de BD, log estructurado, trazas y métricas |
| Transversal | `src/utils/` | Utilidades sin estado de negocio (`anonimizar`) |

Aplicación y dominio se agrupan en `src/core` porque el proyecto lo mantiene una sola persona y
las responsabilidades siguen identificables por archivo (caso de uso vs. regla vs. puerto).

## Regla verificable

1. `src/core` y `src/config` no importan nada de `src/app`, `src/presentation`, `src/infrastructure` ni `src/telemetry`.
2. `src/core` y `src/config` no importan `pino`, `@opentelemetry/*`, `@prisma/client`, `next` ni `pg`.
3. `src/infrastructure` no importa presentación.

Comprobación: `npx jest src/__tests__/arquitectura` (archivo `capas.test.ts`, lógica en `reglasDependencia.ts`).

| Versión | Resultado |
|---|---|
| `ab0713f` (antes) | 1 prueba falla con 2 violaciones: `core/bienestar/evaluaciones.service.ts -> @opentelemetry/api` y `core/logger.ts -> pino` |
| `swiii/g05-capas` | 4 de 4 pruebas de la regla aprobadas; suite completa 9 suites, 31 pruebas |

## Cruce atendido

`src/core/bienestar/evaluaciones.service.ts` vivía en el núcleo, importaba OpenTelemetry y el logger
(que a su vez importa pino) y tenía su propia función `registrarEvaluacion` que **no llamaba al caso
de uso**: devolvía `{ idAnonimoHash: 'anon-xyz-123', status: 'created' }` fijo. Ningún archivo la
importaba. Además, `pino` y `@opentelemetry/api` no estaban en `package.json`, así que ese archivo y
`logger.ts` no compilaban.

Cambio:

- `src/core/logger.ts` → `src/infrastructure/observabilidad/logger.ts` (contenido igual).
- Se elimina `src/core/bienestar/evaluaciones.service.ts`.
- Nuevo `src/infrastructure/observabilidad/registroEvaluacionInstrumentado.ts`: envoltorio que mide,
  traza y registra **alrededor** de `ServicioBienestar` y le delega la operación.
- Se agregan `@opentelemetry/api` y `pino` como dependencias (decididas en ADR-13).

El caso nominal no cambia: `ServicioBienestar.test.ts` y `bienestar.integration.test.ts` siguen
sin modificaciones y en verde. `registroInstrumentado.test.ts` comprueba que el envoltorio devuelve
el mismo id que el caso de uso directo, propaga el mismo error del partido no finalizado y no escribe
el identificador del estudiante en el log.

Diagramas: `docs/diagramas/capas-g05-antes.dot` y `capas-g05-despues.dot` (con sus `.png`).

## Limitaciones

- `src/telemetry/setup.ts` sigue importando paquetes del SDK de OpenTelemetry que no están instalados.
  Es infraestructura y la regla no lo prohíbe, pero no compila; queda como deuda.
- La regla se basa en importaciones estáticas (`import ... from`); un `require` dinámico no se detectaría.
