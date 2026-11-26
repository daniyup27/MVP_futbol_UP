# ADR-18 · PaaS (Render) para el servidor de bienestar, con contenedor reproducible

| Campo | Valor |
|---|---|
| Estado | Aceptado, con una decisión pendiente de la organización (plan de la base) |
| Fecha | 2026-11-25 |
| Contexto de la decisión | FPI-III-16, a partir de FPI-III-15 (`docs/swiii/G15-alojamiento-nube.md`) |
| Relacionados | ADR-10 (Docker multietapa), ADR-11 (CD a Render), ADR-14 (SLO 99,5 %), ADR-16 (seudónimo) |

## Contexto
Restricciones del Taller de arquitectura (Tabla 1): presupuesto USD 0, una sola persona en el equipo,
~500 estudiantes en el pico de una jornada de 2 a 3 horas, ~200 autoevaluaciones por jornada, dos
jornadas por semestre y señal 3G intermitente en las canchas. Los datos de salud mental son sensibles
(Ley 1581). Mediciones de FPI-III-15 en el runner: p95 de 78,7 ms con 50 envíos simultáneos.

## Opciones

| Criterio | IaaS (VM, p. ej. una máquina virtual en un proveedor) | PaaS (Render web service + Render Postgres) | SaaS (formulario en línea listo para usar) |
|---|---|---|---|
| Costo mensual | Depende del proveedor; no se cotizó | USD 0 (Free) o ≈ USD 13,30 (web 7 + base 6 + 1 GB a 0,30) | Variable; los gratuitos no garantizan dónde quedan los datos |
| Lo que opera el equipo | SO invitado, parches, Docker, base, respaldos, TLS | Aplicación, configuración, datos y su respaldo en Free | Solo el formulario |
| Cubre las reglas del MVP | Sí | Sí: corre la misma imagen | No: no aplica seudónimo HMAC, unicidad ni la cola offline con reintento idempotente |
| Encaje con un equipo de una persona | Bajo | Alto | Alto, pero no cumple los requisitos |

## Decisión
Se usa **PaaS (Render)** con la imagen Docker del repositorio, descrita en `render.yaml`. El papel de
los contenedores es que el mismo artefacto (`mvp-futbol-up:<versión>`) se pruebe en el runner y se
ejecute en Render; Render administra el host, el sistema operativo y el balanceo, y el equipo conserva
la aplicación, la configuración, los secretos y los datos.

## Decisión pendiente (Bienestar)
La base Free vence a los 30 días y no tiene respaldos. Para un semestre con dos jornadas hay dos
caminos: pagar la base mínima (USD 6/mes, con recuperación a un punto en el tiempo en el plan pagado)
durante el semestre, o mantener Free y sacar un `pg_dump` después de cada jornada con el procedimiento
de `docs/despliegue/procedimiento-despliegue.md`, aceptando un RPO de una jornada (mitigado por la cola
offline, que reenvía lo que no se confirmó).

## Condición para reconsiderar
Si una jornada real muestra un p95 mayor a 2 s en Render o más de 1 % de errores 5xx (el umbral del
runbook `db-no-responde.md`), o si la universidad ofrece un servidor administrado con respaldo, se vuelve
a evaluar IaaS o alojamiento institucional.
