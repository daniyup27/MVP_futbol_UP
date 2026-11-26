# ADR-17 · Domain Model para registrar la autoevaluación de bienestar

| Campo | Valor |
|---|---|
| Estado | Aceptado |
| Fecha | 2026-11-25 |
| Contexto de la decisión | FPI-III-12, experimento en `swiii/g12-script-vs-modelo` |

## Contexto
El flujo "registrar autoevaluación" se implementó en dos versiones con los mismos puertos y el mismo
contrato: Domain Model (`ServicioBienestar` + `EscalaBienestar`, `AutoevaluacionBienestar`,
`RegistroEvaluacionPartido`) y Transaction Script (`registrarEvaluacionScript`). Las dos pasaron
los mismos casos (`registrarEvaluacion.comparacion.test.ts`). Luego se introdujo el mismo cambio de
regla en ambas: H-02 de RD-01, partido inexistente → `PARTIDO_NO_ENCONTRADO` (404).

## Observaciones

| Medida | Transaction Script | Domain Model |
|---|---|---|
| Parte común (puerto, adaptador, error, HTTP, dobles) | commit `546527b`, 11 archivos, compartida | igual |
| Cambio propio de la regla | `registrarEvaluacionScript.ts`: +2 líneas (commit `1d174bc`) | `ServicioBienestar.ts`: +9 / −1, de las cuales 3 son la regla y el resto la importación reorganizada (commit `2547b56`) |
| Pruebas existentes afectadas | Ninguna propia | `partidoYEvaluacion.test.ts`: 1 expectativa cambia de `PARTIDO_NO_FINALIZADO` a `PARTIDO_NO_ENCONTRADO` |
| Reglas duplicadas | El rango 1..5 y la comparación de escalas se reescriben dentro del script; ya existen en `EscalaBienestar` y `AutoevaluacionBienestar.mismasRespuestas` | Ninguna: cada regla vive en un objeto |
| Reglas reutilizadas por otro código | — | `EscalaBienestar` lo usan `AutoevaluacionBienestar` y el servicio; `Partido.estaFinalizado` lo usa el validador; `RegistroEvaluacionPartido` concentra RF-03 |

Para **este** cambio la versión Script fue más barata: la regla H-02 depende del puerto y no de los
objetos del dominio. La diferencia a favor del Domain Model aparece en las reglas que ya comparten
varias clases (escalas, transición del partido y unicidad), que el script tuvo que copiar.

## Decisión
Se mantiene **Domain Model** para registrar la autoevaluación. El script queda solo como evidencia
del experimento y se retira del código productivo en la siguiente guía, para no dejar las reglas
duplicadas.

Para flujos de una sola regla sin estado compartido (healthcheck, consultas de reportes agregados)
se acepta Transaction Script.

## Condición para reconsiderar
Si en dos cambios seguidos de este flujo la versión Domain Model necesita más archivos de producción
que un procedimiento y ninguna de las reglas tocadas es usada por otra operación, se vuelve a evaluar
pasar el flujo a un script.

## Seguimiento
- 2026-11-25 (FPI-III-13): se retiran `src/core/bienestar/registrarEvaluacionScript.ts` y
  `src/__tests__/comparacion/registrarEvaluacion.comparacion.test.ts`. El experimento queda en el
  historial (commits `c6c4450` a `26e908b`) y en la rama `swiii/g12-script-vs-modelo`. El caso H-02
  sigue cubierto por `partidoYEvaluacion.test.ts` y `unicidadEvaluacion.test.ts`.
