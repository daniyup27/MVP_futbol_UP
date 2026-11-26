# CR-03 · Una autoevaluación por estudiante y partido

| Campo | Valor |
|---|---|
| Origen | Hallazgo H-01 de la revisión de diseño RD-01 |
| Estado | **Aceptado** el 2026-11-25 |
| Decide | Stefanny Fajardo (Product Owner). El docente revisa la decisión en la entrega de FPI-III-10 |
| Línea base | ERS v1.0 (`docs/requisitos/ERS-bienestar-v1.0.md`) |
| Versiones resultantes | ERS v1.1, matriz de trazabilidad v1.1 |

## Solicitud
Agregar a la ERS un requisito de unicidad: como máximo una autoevaluación por estudiante
(`idAnonimoHash`) y partido. Un reintento con las mismas escalas no crea otro registro y devuelve el
mismo id; un envío con escalas distintas se rechaza con `EVALUACION_YA_REGISTRADA`.

## Evidencia que la motiva
Con el código de `swiii/g09-contrato-repositorio`, el mismo estudiante registró tres evaluaciones
para `partido-7` (dos con escalas 4/3 y una con 2/2). Resultado observado: ids `mem-1`, `mem-2`,
`mem-3`, 3 registros con el mismo hash. El diseño de Software II ya preveía la regla
(`validarUnicidad()` en el diagrama de clases y restricción UNIQUE en el Taller de arquitectura) y la
cola offline de la PWA reintenta envíos, así que un reintento hoy duplicaría datos.

## Análisis de impacto

| Elemento | Impacto |
|---|---|
| ERS | Nuevo RF-03 (versión 1.1) |
| Dominio | Invariante nueva; decidir dónde se protege (FPI-III-11) |
| Puerto `IRepositorioBienestar` o consulta | Necesita buscar por hash y partido |
| Adaptadores (memoria, Prisma) | Implementar la búsqueda; la prueba de contrato debe cubrirla |
| Contrato HTTP | Nuevo código `EVALUACION_YA_REGISTRADA` (409) y respuesta del reintento |
| Persistencia | Restricción UNIQUE en la migración cuando exista (FPI-III-14) |
| Pruebas | CP-03: reintento igual, envío distinto y estudiante distinto |
| `openapi.yaml`, `anonimizar.ts` | No se tocan (CR-01). El código nuevo se suma a CR-02 |

## Resolución
Se acepta para el MVP. Se implementa y verifica con CP-03 en FPI-III-11; la matriz pasará RF-03 de
`pendiente` a `verificado` en ese momento.
