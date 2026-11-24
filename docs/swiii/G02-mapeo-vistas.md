# FPI-III-02 · Mapeo lógico ↔ físico

Diagramas editables: `docs/diagramas/vista-logica.dot`, `docs/diagramas/vista-fisica.dot`.

| Módulo lógico | Artefacto y nodo | Interfaz o protocolo |
|---|---|---|
| Presentación `api/health` | `src/app/api/health/route.ts` → imagen Docker → Web Service Render | HTTPS GET `/api/health` |
| Presentación `api/bienestar/evaluaciones` | Definido en `docs/api/openapi.yaml`; **sin route.ts en el repo** | HTTPS POST (contrato) |
| Bienestar `ServicioBienestar` | Mismo proceso Node que la presentación | Llamada local a método |
| Puertos `IRepositorioBienestar`, `IValidadorPartido` | Interfaces TS, sin artefacto propio | Llamada local |
| Adaptador `RepositorioBienestarPrisma` | Mismo proceso; cliente simulado (`dbClient: any`) | TCP :5432 vía `DATABASE_URL` (previsto) |
| `anonimizar` (ADR-16) | Mismo proceso | Llamada local; secreto `ANONIMIZATION_SALT` por variable de entorno |
| Telemetría / métricas | Mismo proceso; exportador en :9464 | Prometheus scrape `/metrics` (solo docker-compose local) |
| Pipeline CD | GitHub Actions (runner ubuntu) | HTTPS webhook a Render + GET `/api/health` |

## Comprobación de enlaces

| Condición | Resultado observado | Evidencia |
|---|---|---|
| Nominal (dobles en memoria) | Evaluación persistida con hash de 64 hex | `bienestar.integration.test.ts` |
| PostgreSQL no disponible (ECONNREFUSED simulado) | El error se propaga; no se devuelve id | `dependencia-no-disponible.test.ts` |
| Validador de partidos sin respuesta | Rechazo; el repositorio no se invoca | `dependencia-no-disponible.test.ts` |

## Enlace físico corregido: CD → healthcheck

`deploy.yml` consultaba `/health`, pero la ruta del App Router se publica en `/api/health`. Además, un paso
mal indentado quedó dentro del bloque `run` de "Esperar…", de modo que bash recibía el texto
`- name: Healthcheck…` como comando y los pasos de verificación estaban duplicados. Se corrigió en esta rama.
