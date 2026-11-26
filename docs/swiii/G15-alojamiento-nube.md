# FPI-III-15 · Alternativas de alojamiento con medidas comparables

Rama: `swiii/g15-alojamiento-nube` (parte de `swiii/g14-persistencia`).

## Qué se construyó
- Servidor desplegable: `src/composicion/main.ts` (migraciones al arrancar, `/api/health` con consulta a
  la base, JWT HS256, Data Mapper sobre `pg`).
- Imagen: `Dockerfile` multietapa (el anterior compilaba Next.js, que el repositorio no tiene; con ese
  archivo no se podía construir ninguna imagen).
- Entorno: `docker-compose.yml` (PostgreSQL 16 + servidor) y workflow `entorno-reproducible.yml`.
- Carga: `scripts/carga.mjs`.

## Mediciones (runner de GitHub Actions, 4 vCPU, 15 700 MB de RAM, commit `baa9ac7`)

| Condición | Volumen | Duración | p50 | p95 | p99 | Códigos | Filas finales |
|---|---|---|---|---|---|---|---|
| Nominal | 200 envíos, 5 simultáneos | 255 ms | 4,4 ms | 9,7 ms | 54,9 ms | 200 × 201 | 200 |
| Alta | 1000 envíos, 50 simultáneos | 829 ms | 34,7 ms | 78,7 ms | 102,6 ms | 1000 × 201 | 1000 |

Arranque: imagen de 48,9 MB construida en 9 s; 10,1 s desde `docker compose up` hasta salud 200
(incluye esperar a que PostgreSQL quede sano); el servidor tarda 40 ms desde que la base responde.

Estas cifras son del runner, que tiene una capacidad fija. No demuestran elasticidad ni disponibilidad
en Render: sirven como línea base para comparar.

## Estimación de costo mensual (precios de render.com consultados el 2026-11-25)

| Alternativa | Supuestos | Costo |
|---|---|---|
| Render gratuito (actual) | Web Free (512 MB, se duerme a los 15 min sin tráfico, ~1 min en despertar); Postgres Free (1 GB, vence a los 30 días, sin respaldos) | USD 0 |
| Render pagado mínimo | Web 0.5c-512mb USD 7; Postgres 0.1c-256mb USD 6; almacenamiento USD 0,30/GB (1 GB supuesto); 5 GB de transferencia incluidos (Hobby) | ≈ USD 13,30 |
| Local (equipo de Bienestar) | Equipo existente; energía, red, respaldo y soporte sin cifras confirmadas | No estimado: faltan datos de la organización |

Volumen de datos (estimación pedagógica): ~200 autoevaluaciones por jornada y 2 jornadas por semestre
(Taller de arquitectura, Tabla 1) son ~400 filas por semestre; muy por debajo de 1 GB.
