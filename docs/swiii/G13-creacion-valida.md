# FPI-III-13 · Creación válida de la autoevaluación

Rama: `swiii/g13-creacion-valida` (parte de `swiii/g12-script-vs-modelo`).

## Problema observado
Con el código de `swiii/g12-script-vs-modelo`, `AutoevaluacionBienestar.registrar` aceptaba un
seudónimo vacío, un identificador en claro (`1090000000`) como seudónimo, un partido vacío y una fecha
inválida, y el repositorio guardaba esos objetos (`mem-1` con hash `""`, `mem-2` con hash
`1090000000` e `Invalid Date`). Con un anonimizador defectuoso, la petición HTTP respondía 201.

## Opciones comparadas

| Fuerza | Método de creación nombrado (`AutoevaluacionBienestar.registrar`) | Factory (`FabricaAutoevaluacion` con anonimizador, validador y reloj) |
|---|---|---|
| Datos obligatorios | Seudónimo, partido, dos escalas, fecha opcional | Id del estudiante, id del partido, escalas; la fábrica obtiene hash, estado y fecha |
| Invariantes al nacer | Formato del seudónimo, partido no vacío, escalas, fecha válida | Las mismas, más "partido finalizado" |
| Dependencias | Ninguna: solo dominio | Puertos asíncronos (`IAnonimizador`, `IValidadorPartido`) dentro de la creación |
| Error cuando falta algo | `InvarianteVioladaError` o `DATOS_INVALIDOS` al construir | Igual, pero mezclado con `DependenciaNoDisponibleError` si un puerto falla durante la creación |
| Prueba aislada | Directa, sin dobles | Requiere dobles de tres colaboradores |
| Quién coordina hoy | `ServicioBienestar` ya consulta el partido y el anonimizador | Duplicaría esa coordinación |

Decisión: **método de creación nombrado reforzado**. La creación tiene varias condiciones, pero una
sola decisión real (¿los datos están completos?), y las consultas a puertos ya las coordina el
servicio de aplicación. Una fábrica con puertos volvería asíncrona la creación de una entidad.

## Pruebas
- `src/core/__tests__/dominio/creacionAutoevaluacion.test.ts`: 7 construcciones inválidas, escala
  fuera de rango y fronteras (64 hex exactos; 63 y 65 rechazados; escalas 1 y 5).
- `src/__tests__/integration/creacionIncompleta.test.ts`: anonimizador defectuoso → 500, 0 registros
  y sin el dato en la respuesta.
- Regla 5 en `capas.test.ts`: `src/core/dominio` solo importa dominio, errores y puertos.

Antes del cambio (mismas pruebas sobre `9b33415`): 8 de 11 fallaban; la de HTTP recibía 201.
