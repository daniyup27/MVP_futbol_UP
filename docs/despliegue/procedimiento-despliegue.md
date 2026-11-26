# Procedimiento de despliegue, verificación y recuperación (FPI-III-16)

El workflow `.github/workflows/recuperacion.yml` ejecuta estos pasos en cada push a `swiii/g16-*`.

## Puesta en marcha (local o en el runner)
1. Crear `.env` (no versionado) con `APP_VERSION`, `POSTGRES_PASSWORD`, `ANONIMIZATION_SALT` (32+),
   `JWT_SECRET` (32+) y `PARTIDOS_FINALIZADOS`.
2. `docker compose build app` → imagen `mvp-futbol-up:<APP_VERSION>`.
3. `docker compose up -d` y esperar `GET /api/health` → `200 {"status":"ok","version":...}`.
4. Las migraciones se aplican al arrancar; el log `arranque` dice cuáles.

## Puesta en marcha en Render (PaaS)
1. En Render: New → Blueprint → este repositorio (`render.yaml`).
2. Ingresar `ANONIMIZATION_SALT`, `JWT_SECRET` y `PARTIDOS_FINALIZADOS` cuando Render los pida.
3. Verificar `https://<servicio>.onrender.com/api/health`.

## Respaldo
`docker compose exec -T db pg_dump -U futbol_user -d futbol_up -Fc > respaldo.dump`
(en Render: `pg_dump` contra la URL externa de la base). Guardar el archivo fuera del repositorio: contiene
datos de salud seudonimizados.

## Restauración
1. `docker compose up -d db` y esperar `pg_isready`.
2. `docker compose exec -T db pg_restore -U futbol_user -d futbol_up --no-owner < respaldo.dump`
3. `docker compose up -d app` y esperar salud 200.
4. Verificar: conteo de filas igual al del respaldo; un reintento de una evaluación respaldada responde
   201 sin crear fila; la cola offline reenvía lo posterior al respaldo.

## Reversión
Si la salud no responde 200 en 20 s después de un cambio, volver a la imagen o configuración anterior
(`docker compose up -d --force-recreate app` con el `.env` anterior; en Render, "Rollback" al deploy previo).
