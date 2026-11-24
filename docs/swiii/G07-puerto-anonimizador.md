# FPI-III-07 · Puerto `IAnonimizador` y composición en el arranque

Rama: `swiii/g07-puerto-anonimizador` (parte de `swiii/g06-servicio-evaluaciones`).

## Problemas de acoplamiento revisados

| # | Problema | Evidencia en el código | Costo de cambio | Decisión |
|---|---|---|---|---|
| 1 | `ServicioBienestar` (aplicación) importa la función concreta `generarHashAnonimo`, que lee `process.env.ANONIMIZATION_SALT` en cada llamada | `src/core/ServicioBienestar.ts -> src/utils/anonimizar.ts` | Alto: probar el servicio obliga a fijar variables de entorno globales o a reemplazar el módulo por ruta con `jest.mock`; un secreto faltante solo se nota en la primera petición | **Intervenido** |
| 2 | `RepositorioBienestarPrisma` recibe `dbClient: any`, no usa el cliente y devuelve `db-id-${Date.now()}` sin persistir | `src/infrastructure/adapters/RepositorioBienestarPrisma.ts` | Medio: hoy nadie lo usa en producción, pero cualquier prueba sobre él "pasa" sin guardar nada | **Priorizado** para FPI-III-09 |

No se encontraron ciclos entre módulos: ningún archivo de `src/core` es importado por un archivo que
él mismo importe (lista completa con `python3 deps.py` en la ficha).

## Cambio

- Nuevo puerto `src/core/ports/IAnonimizador.ts` con el contrato escrito en el propio archivo.
  Es la interfaz `IAnonimizador` que ya aparecía en el diagrama de clases refactorizado de Software II.
- `ServicioBienestar` recibe el anonimizador por constructor y deja de importar `utils/anonimizar`.
- `src/infrastructure/seguridad/AnonimizadorHmac.ts` implementa el puerto reutilizando
  `src/utils/anonimizar.ts` **sin modificarlo** (mismo HMAC, mismo secreto; ver CR-01: ese archivo
  solo se toca con aprobación). Valida el secreto al construirse.
- `src/composicion/bienestar.ts` es la raíz de composición: elige `AnonimizadorHmac` en el arranque.
- Nueva regla de arquitectura: el núcleo no lee `process.env` ni importa módulos que lo lean.

## Importaciones antes y después

Antes (`swiii/g06-servicio-evaluaciones`):

```
src/core/ServicioBienestar.ts -> src/utils/anonimizar.ts
src/utils/anonimizar.ts -> crypto   (y lee process.env)
```

Después:

```
src/core/ServicioBienestar.ts -> src/core/ports/IAnonimizador.ts
src/infrastructure/seguridad/AnonimizadorHmac.ts -> src/core/ports/IAnonimizador.ts
src/infrastructure/seguridad/AnonimizadorHmac.ts -> src/utils/anonimizar.ts
src/composicion/bienestar.ts -> src/infrastructure/seguridad/AnonimizadorHmac.ts
```

Diagramas: `docs/diagramas/dependencias-g07-antes.dot` y `dependencias-g07-despues.dot`.

## Comprobación repetible

```bash
npx jest src/__tests__/arquitectura src/__tests__/contratos --verbose
```

| Comprobación | Antes | Después |
|---|---|---|
| Regla "núcleo no lee entorno" | Falla: `src/core/ServicioBienestar.ts -> src/utils/anonimizar.ts (el destino lee process.env)` | Aprobada |
| Contrato de `IAnonimizador` con `AnonimizadorHmac` | No existía | 5 de 5 condiciones |
| Contrato con `AnonimizadorDePrueba` | No existía | 5 de 5 condiciones |
| Doble constante `'a' x 64` (el `jest.mock` anterior) | Se usaba en `ServicioBienestar.test.ts` | Incumple "distinto por estudiante" y "rechaza vacío" |
| UUID v4 aleatorio (decisión previa a ADR-16) | — | Incumple "determinista" y "formato 64 hex" |
| `AnonimizadorHmac` vs `generarHashAnonimo` | — | Mismo hash para `1090000000` |
| Suite completa | 10 suites, 41 pruebas | 11 suites, 48 pruebas |

## Compromiso de mantenimiento

- `ServicioBienestar` ahora tiene tres dependencias en el constructor; quien lo construya debe pasar
  por `crearServicioBienestar` o inyectar las tres.
- Toda implementación nueva de `IAnonimizador`, incluidos los dobles, debe pasar
  `incumplimientosDelContrato`. Si alguien cambia el contrato, cambia para todas a la vez.
- Como el secreto se valida al construir, un ambiente sin `ANONIMIZATION_SALT` ya no arranca. Es lo
  que se busca, pero obliga a configurarlo también en cualquier script que construya el servicio.
- `utils/anonimizar.ts` sigue leyendo el entorno en cada llamada; se dejó así para no tocar un archivo
  protegido por CR-01. Pasar el secreto por constructor queda como mejora sujeta a aprobación.
