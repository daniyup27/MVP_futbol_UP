# FPI-III-08 · Entidades, objetos de valor e invariantes

Rama: `swiii/g08-modelo-dominio` (parte de `swiii/g07-puerto-anonimizador`).
Capacidad modelada: **finalizar un partido y registrar la autoevaluación de ese partido**.
Base: diagrama de clases de diseño de Software II (`docs/Diagrama de clases de diseño.png`),
que define `Partido` con `estado`, `goles_local`, `goles_visitante`, `finalizarPartido()` y
`estaFinalizado()`, y `AutoevaluacionBienestar` con `escala_fisica` y `escala_mental`.

## Objetos y responsabilidades

| Objeto | Tipo | Identidad / igualdad | Regla que protege con sus propios datos |
|---|---|---|---|
| `Partido` (`src/core/dominio/Partido.ts`) | Entidad | `id`; se conserva al finalizar | Solo se finaliza desde `PROGRAMADO`; el marcador se valida antes de cambiar el estado |
| `Marcador` (`Marcador.ts`) | Objeto de valor | Por goles local y visitante | Goles enteros mayores o iguales a 0 |
| `EscalaBienestar` (`EscalaBienestar.ts`) | Objeto de valor | Por `valor` | Entero entre 1 y 5 |
| `AutoevaluacionBienestar` (`AutoevaluacionBienestar.ts`) | Entidad | `id_evaluacion` asignado por la persistencia | No existe con escalas fuera de rango; nunca recibe `idEstudiante` |
| `ValidadorPartidoEnMemoria` (infraestructura) | Adaptador | — | Ninguna: le pregunta a la entidad `Partido` |
| `ServicioBienestar` | Servicio de aplicación | — | Coordina; ya no valida escalas por su cuenta |

La validación de escalas que en FPI-III-06 estaba en `ServicioBienestar` (función `validarEscala`)
se movió a `EscalaBienestar`. No quedó duplicada: el servicio solo llama a `EscalaBienestar.crear`.

Diagramas: `docs/diagramas/clases-g08-dominio.mmd` y `secuencia-g08-finalizar-y-evaluar.mmd` (con `.png`).

## Tabla de transición de `Partido`

| Estado actual | Operación | Condición | Estado final | Resultado |
|---|---|---|---|---|
| PROGRAMADO | `finalizar(g1, g2)` | g1 y g2 enteros ≥ 0 | FINALIZADO | Marcador guardado |
| PROGRAMADO | `finalizar(g1, g2)` | algún gol negativo o no entero | PROGRAMADO | `MarcadorInvalidoError`, marcador sigue `null` |
| FINALIZADO | `finalizar(...)` | cualquiera | FINALIZADO | `TransicionInvalidaError`, marcador original intacto |

Frontera exacta: **0 goles es válido** (0-0 finaliza el partido); **-1 se rechaza**.
No se agregó un estado `EN_CURSO` porque ningún requisito documentado lo usa todavía.

## Pruebas

```bash
npx jest src/core/__tests__/dominio src/__tests__/integration/partidoYEvaluacion.test.ts --verbose
```

| Caso | Operación invocada | Estado final observado |
|---|---|---|
| Transición aceptada | `Partido.programado('partido-7').finalizar(2, 1)` | `FINALIZADO`, marcador 2-1, id `partido-7` |
| Transición inválida | segundo `finalizar(0, 0)` | `TransicionInvalidaError`; sigue `FINALIZADO` con 2-1 |
| Frontera válida | `finalizar(0, 0)` | `FINALIZADO`, marcador 0-0 |
| Frontera inválida | `finalizar(-1, 0)` | `MarcadorInvalidoError`; sigue `PROGRAMADO`, marcador `null` |
| Escala límite | `EscalaBienestar.crear(1)` y `crear(5)` | aceptadas |
| Escala fuera | `crear(0)`, `crear(6)`, `crear(3.5)`, `crear(NaN)` | `DATOS_INVALIDOS` |
| Colaboración | partido finalizado → `registrarEvaluacion(..., 5, 1)` | `mem-1`, 1 registro |
| Colaboración rechazada | partido `PROGRAMADO` o inexistente | `PARTIDO_NO_FINALIZADO`, 0 registros |

Suite completa de la rama: 14 suites, 68 pruebas.

## Limitaciones

- `Partido` todavía no tiene repositorio persistente; vive en memoria para las pruebas.
- La regla "un partido inexistente se trata como no finalizado" se toma del Taller de arquitectura
  (escenario "partido inexistente": se rechaza y no se escribe nada).
