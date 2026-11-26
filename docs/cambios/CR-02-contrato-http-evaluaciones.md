# CR-02 · Ajustar el contrato HTTP de `POST /bienestar/evaluaciones`

| Campo | Valor |
|---|---|
| Estado | **Propuesto**, pendiente de aprobación |
| Origen | FPI-III-06, implementación del recorrido vertical |
| Solicitante | Stefanny Fajardo (Product Owner) |
| Aprobadores | Docente del curso y coordinación de Bienestar (mismo criterio de CR-01) |
| Línea base | `swiii-linea-base` + ADR-16 |

## Cambio solicitado en `docs/api/openapi.yaml`

1. Separar respuestas: `400` para datos inválidos, `409` para partido no finalizado y agregar `503`
   para validador o base no disponibles.
2. Respuesta `201`: devolver `idEvaluacion` y `mensaje`. Dejar de devolver `idAnonimoHash`.
3. Corregir la descripción "UUID v4" por la seudonimización HMAC-SHA256 de ADR-16.

## Justificación

- Con un solo `400`, la PWA no puede distinguir un dato que el estudiante debe corregir de una
  situación que solo se resuelve esperando a que el partido termine.
- Sin `503`, una caída de la base no tiene código propio y la cola offline no sabe que debe reintentar.
- El hash es estable por estudiante (ADR-16). Enviarlo al cliente lo deja expuesto en el dispositivo
  y en registros intermedios sin que el cliente lo necesite.

## Impacto

| Elemento | Impacto |
|---|---|
| `docs/api/openapi.yaml` | Medio: contrato público |
| PWA (cola offline) | Bajo: hoy no consume la respuesta; deberá leer `idEvaluacion` |
| `src/presentation/http/evaluacionesHttp.ts` | Ya implementa la versión propuesta; la ruta no se publica hasta aprobar |
| Pruebas | `src/__tests__/http/registrarEvaluacion.http.test.ts` ya cubre los cinco resultados |
