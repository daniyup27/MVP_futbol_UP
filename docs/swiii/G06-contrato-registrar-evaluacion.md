# FPI-III-06 · Contrato y recorrido de `registrarEvaluacion`

Rama: `swiii/g06-servicio-evaluaciones` (parte de `swiii/g05-capas`).

## Contrato interno (interfaz tipada del servicio de aplicación)

```ts
// src/core/ServicioBienestar.ts
registrarEvaluacion(
  idEstudiante: string,   // sale del claim sub del token, nunca del cuerpo
  idTorneo: string,       // se conserva por compatibilidad; no entra en el hash (ADR-16)
  idPartido: string,
  escalaFisica: number,   // entero 1..5
  escalaMental: number    // entero 1..5
): Promise<string>        // id asignado por la persistencia
```

| Elemento | Definición |
|---|---|
| Precondiciones | Usuario autenticado (sub presente); escalas enteras entre 1 y 5; partido finalizado |
| Poscondición de éxito | Queda una evaluación con `idAnonimoHash` HMAC-SHA256, sin `idEstudiante`, y se devuelve su id |
| Error de negocio | `DatosEvaluacionInvalidosError` (`DATOS_INVALIDOS`), `PartidoNoFinalizadoError` (`PARTIDO_NO_FINALIZADO`) |
| Error técnico | `DependenciaNoDisponibleError` (`DEPENDENCIA_NO_DISPONIBLE`), con `dependencia` = `validador-partidos` o `persistencia` y la causa original |
| Garantía en error | No se persiste nada |

Errores definidos en `src/core/errores.ts`. El servicio envuelve cualquier fallo de un puerto que
no sea de negocio en `DependenciaNoDisponibleError`, así una caída nunca se reporta como regla incumplida.

## Adaptador HTTP (`src/presentation/http/evaluacionesHttp.ts`)

| Resultado | HTTP | Cuerpo |
|---|---|---|
| Registrada | 201 | `{ "idEvaluacion": "mem-1", "mensaje": "Evaluación registrada correctamente." }` |
| Sin token | 401 | `{ "codigo": "NO_AUTENTICADO" }` |
| Forma inválida o PII en el cuerpo | 400 | `{ "codigo": "FORMATO_INVALIDO" }` |
| Escala fuera de rango | 400 | `{ "codigo": "DATOS_INVALIDOS" }` |
| Partido no finalizado | 409 | `{ "codigo": "PARTIDO_NO_FINALIZADO" }` |
| Validador o base caídos | 503 | `{ "codigo": "DEPENDENCIA_NO_DISPONIBLE" }` (sin detalles técnicos) |
| Otro error | 500 | `{ "codigo": "ERROR_INTERNO" }` |

Ejemplo de petición:

```http
POST /api/bienestar/evaluaciones
Authorization: Bearer <token con sub>
Content-Type: application/json

{ "idPartido": "partido-finalizado", "escalaFisica": 4, "escalaMental": 3 }
```

Secuencia: `docs/diagramas/secuencia-g06-registrar-evaluacion.mmd` (y `.png`).

## Ejemplo ejecutable y verificación

```bash
npx jest src/__tests__/http --verbose
```

| Camino | Resultado observado | Estado de datos |
|---|---|---|
| Éxito | 201, `idEvaluacion: mem-1` | 1 registro, hash de 64 hex, sin `estudiante-A` |
| Rechazo: partido no finalizado | 409 `PARTIDO_NO_FINALIZADO` | 0 registros |
| Dependencia caída (ECONNREFUSED) | 503 `DEPENDENCIA_NO_DISPONIBLE`, sin `ECONNREFUSED` en el cuerpo | 0 registros |
| Rechazo: escala 6 | 400 `DATOS_INVALIDOS`, validador no consultado | 0 registros |
| Sin token / cédula en el cuerpo | 401 / 400 | 0 registros |

Suite completa de la rama: 10 suites, 41 pruebas.

## Diferencias con `docs/api/openapi.yaml`

El contrato publicado responde 400 también para "partido no finalizado", no declara 503 y devuelve
`idAnonimoHash` con formato UUID. Esos puntos chocan con ADR-16 y con la separación entre errores de
negocio y técnicos. Como cambiar el contrato público exige aprobación (CR-01), quedan propuestos en
`docs/cambios/CR-02-contrato-http-evaluaciones.md` y la ruta no se publica en Next.js hasta aprobarlos.

## Limitaciones

- La autenticación se inyecta (`autenticar(req)`); la verificación del JWT no está implementada.
- El ejemplo usa un servidor Node mínimo, porque `next` no está instalado en el repositorio.
- El validador de partidos sigue siendo un puerto sin adaptador real.
