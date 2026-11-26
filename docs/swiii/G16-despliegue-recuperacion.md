# FPI-III-16 · Modelo de servicio, despliegue reproducible y recuperación

Rama: `swiii/g16-despliegue-recuperacion` (parte de `swiii/g15-alojamiento-nube`).

- Decisión: `docs/adr/ADR-18-modelo-de-servicio-nube.md` (PaaS Render; plan de la base pendiente)
- Diagrama de despliegue: `docs/diagramas/despliegue-g16.dot`
- Matriz de responsabilidades: `docs/despliegue/matriz-responsabilidades.md`
- Procedimiento: `docs/despliegue/procedimiento-despliegue.md`
- Blueprint de Render: `render.yaml`
- Ejecución del procedimiento: `.github/workflows/recuperacion.yml` (runner de GitHub Actions con Docker)

Alcance: la validación se hizo en contenedores dentro del runner, no en Render. El despliegue a Render
desde `main` sigue el ADR-11 y requiere que el PR se fusione y que se configuren los secretos en Render.
