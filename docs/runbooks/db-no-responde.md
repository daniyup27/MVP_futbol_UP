# Runbook: Base de datos no responde (Alerta Crítica)

**Síntoma:** Grafana alerta "Porcentaje de errores > 5%" o "Latencia p95 > 2000ms" en el endpoint `/bienestar/evaluaciones`.
**Impacto:** Los estudiantes no pueden registrar sus evaluaciones de bienestar.
**Responsable:** Desarrollador On-Call (Única persona del equipo).

## Pasos de verificación y recuperación:

1. **Verificar el estado de los contenedores:**
   ```bash
   docker ps | grep mvp-futbol-up-db
