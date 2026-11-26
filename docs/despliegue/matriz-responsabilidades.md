# Matriz de responsabilidades por modelo (FPI-III-16)

E = equipo (Stefanny Fajardo) · P = proveedor · C = compartida

| Actividad | IaaS (VM) | PaaS (Render) — elegida | SaaS (formulario) | Fuente / evidencia en PaaS |
|---|---|---|---|---|
| Código de la aplicación | E | E | P | Repositorio y CI |
| Runtime (Node 20) | E | E (lo fija la imagen) | P | `Dockerfile` |
| Sistema operativo del host | E | P | P | Render administra el host |
| Sistema base de la imagen | E | E (`node:20-alpine`) | P | `Dockerfile`; Trivy en CI |
| Datos de autoevaluación | E | E | C | Tabla `autoevaluacion_bienestar` |
| Respaldos | E | E en Free (no hay respaldos); P en pagado (recuperación a un punto en el tiempo) | P | render.com/docs/free; procedimiento `pg_dump` |
| Restauración | E | E (ejecuta el procedimiento) | P | Workflow `recuperacion.yml` |
| Acceso de estudiantes (JWT) | E | E | P | `verificarJwt.ts` |
| Acceso al panel y secretos | E | C (Render guarda; el equipo define y rota) | P | `render.yaml` (`sync: false`) |
| TLS / HTTPS | E | P | P | Dominio onrender.com |
| Actualizaciones de dependencias | E | E | P | `npm ci`, Trivy |
| Disponibilidad del servicio | E | C (P la plataforma; E que la app arranque) | P | `/api/health`, ADR-14 |
