# ADR-16 · Estrategia de seudonimización del idAnonimoHash

- **Estado:** Aceptado (2026-11-21)
- **Contexto de trazabilidad:** FPI-III-01 · RF-02 · AQ-01 · Ley 1581 de 2012
- **Relación:** complementa la restricción de "SHA-256 + salt" del cierre de SW II; no reemplaza ningún ADR previo.

## Contexto

Al recuperar la línea base `swiii-linea-base` (commit `c4de7e2`) se encontró una contradicción:

- `src/utils/anonimizar.ts` generaba `SHA-256(salt:identificador)`, es decir, un hash **determinista**, y usaba
  un salt por defecto escrito en el código (`'mvp-futbol-up-salt-2026'`) si faltaba la variable de entorno.
- `bienestar.integration.test.ts` exigía que el `idAnonimoHash` fuera un **UUID v4 aleatorio** y que diez
  evaluaciones del mismo estudiante produjeran diez valores distintos.
- `ServicioBienestar` importaba `../utils/anonimizacion` (archivo inexistente) con dos argumentos.

Las dos expectativas son incompatibles y la decisión afecta varios módulos (dominio, persistencia,
pruebas, configuración de despliegue y secretos), por lo que tiene alcance arquitectónico.

Fuerzas:

1. La Dependencia de Bienestar necesita seguimiento **integral** del estudiante entre partidos y torneos.
2. La Ley 1581 obliga a no almacenar ni registrar datos personales sin necesidad en evaluaciones de salud.
3. Equipo de una persona y presupuesto cero (Render free tier): nada de servicios de tokenización externos.
4. Los secretos deben vivir en GitHub Secrets / variables de Render, nunca en el código.

## Alternativas

| | A. UUID v4 aleatorio por evaluación | B. HMAC-SHA256 con secreto externo (elegida) |
|---|---|---|
| Vinculación longitudinal | Imposible: cada registro queda aislado | Sí: mismo estudiante → mismo hash |
| Riesgo de reidentificación | Muy bajo | Bajo mientras el secreto esté custodiado |
| Dependencia operativa | Ninguna | Secreto obligatorio en cada ambiente |
| Costo | Cero | Cero (módulo `crypto` de Node) |
| Cumple RF-02 (seguimiento) | No | Sí |

## Decisión

Se adopta **B**: `idAnonimoHash = HMAC-SHA256(ANONIMIZATION_SALT, idEstudiante)` en hexadecimal (64 caracteres).
El hash depende solo del estudiante (no del torneo) para permitir el seguimiento entre semestres.
`ANONIMIZATION_SALT` es obligatorio (mínimo 32 caracteres) y **no tiene valor por defecto**: si falta, la
función lanza un error.

## Consecuencias

- (+) Se recupera el seguimiento longitudinal que justifica el módulo de bienestar.
- (+) Se elimina el secreto embebido en el código.
- (−) El dato sigue siendo **seudonimizado**, no anónimo: quien tenga el secreto y la lista de identificadores puede
  recalcular hashes. El secreto se trata como credencial.
- (−) Rotar el secreto rompe la vinculación con registros anteriores; una rotación requiere un nuevo ADR y un plan de
  migración.
- (−) Despliegue: hay que crear `ANONIMIZATION_SALT` en Render y en GitHub Secrets antes del siguiente despliegue.

## Verificación

- `src/utils/__tests__/anonimizar.test.ts`: formato de 64 hex, fallo sin secreto, cambio de hash al cambiar el secreto.
- `src/__tests__/integration/bienestar.integration.test.ts`: el repositorio no recibe `idEstudiante`, `cedula` ni
  `nombre`; mismo estudiante → mismo hash; estudiantes distintos → hashes distintos.
- Revisar esta decisión si Bienestar deja de requerir seguimiento entre torneos o si se exige anonimización
  irreversible por un concepto jurídico de la universidad.
