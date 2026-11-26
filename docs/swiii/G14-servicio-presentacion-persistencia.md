# FPI-III-14 · Servicio, presentación, datos y persistencia

Rama: `swiii/g14-persistencia` (parte de `swiii/g13-creacion-valida`).

## Bloque A · Contrato del servicio expuesto
`POST /api/bienestar/evaluaciones` (adaptador `src/presentation/http/evaluacionesHttp.ts`).
No hay servicio remoto consumido: el validador de partidos y el repositorio son puertos del mismo proceso.

| Situación | Respuesta | ¿El cliente debe reintentar? |
|---|---|---|
| Registrada | 201 `{ idEvaluacion, mensaje }` | No |
| Reintento igual (RF-03) | 201 con el **mismo** `idEvaluacion` | No (ya quedó) |
| Escalas inválidas / forma | 400 | No: corregir |
| Sin token | 401 | Tras iniciar sesión |
| Partido inexistente | 404 `PARTIDO_NO_ENCONTRADO` | No |
| Partido no finalizado / evaluación distinta ya registrada | 409 | No |
| Validador o base caídos | 503 `DEPENDENCIA_NO_DISPONIBLE` | **Sí**: la escritura es idempotente por RF-03 |
| Invariante violada por el sistema | 500 `ERROR_INTERNO` | No automáticamente |

Prueba: «503 mientras la base está caída; al volver, el reintento responde 201 y un tercer envío
igual devuelve el mismo id» en `src/__tests__/http/registrarEvaluacion.http.test.ts`.

## Bloque B · Presentación
`src/presentation/pwa/formularioEvaluacion.ts`: `validarFormulario` (forma, mensajes por campo) y
`estadoTrasEnvio` (estado de interfaz y si la evaluación sigue en la cola offline).
Pruebas: `src/__tests__/presentacion/formularioEvaluacion.test.ts`.

## Bloque C · Esquema versionado y Data Mapper
- Migración `db/migraciones/001_crear_autoevaluacion_bienestar.sql` (CHECK de formato del seudónimo,
  CHECK de escalas 1..5, UNIQUE (id_anonimo_hash, id_partido)).
- `src/infrastructure/persistencia/migraciones.ts`: aplica en orden y registra en `schema_migraciones`,
  cada migración en su propia transacción.
- `src/infrastructure/adapters/RepositorioBienestarSql.ts` (Data Mapper) sobre `ClienteSql`.
- Consulta para verificar el estado final:
  `SELECT count(*) FROM autoevaluacion_bienestar WHERE id_anonimo_hash = $1 AND id_partido = $2;`

## Bloque D · Atomicidad, permanencia y escritura repetida
`src/__tests__/persistencia/persistencia.integracion.test.ts` sobre PGlite (PostgreSQL compilado a
WebAssembly, `@electric-sql/pglite` 0.6.0, solo en desarrollo). Ejecutar con `npm test` (el script usa
`--experimental-vm-modules`, que PGlite necesita dentro de Jest).

Diagramas: `docs/diagramas/datos-g14-autoevaluacion.mmd` y `secuencia-g14-pwa-servicio-datos.mmd`.

## Limitaciones
- En producción haría falta un `ClienteSql` sobre `pg` (no instalado). El adaptador Prisma de
  FPI-III-09 sigue en el código, pero no se puede ejecutar sin los motores de Prisma.
- PGlite usa una sola conexión: la concurrencia de las pruebas es la de dos peticiones intercaladas
  en el mismo proceso, no la de dos conexiones del pool.
