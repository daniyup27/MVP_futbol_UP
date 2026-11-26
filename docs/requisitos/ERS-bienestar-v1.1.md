# ERS · Módulo de Bienestar y Torneos · versión 1.1

| Campo | Valor |
|---|---|
| Versión | 1.1 |
| Cambios frente a 1.0 | Se agrega RF-03 por la solicitud de cambio CR-03 (revisión RD-01) |
| Estado | Aprobada por el Product Owner el 2026-11-25 |
| Documento previo | `ERS-bienestar-v1.0.md` (se conserva sin cambios) |

RF-01, RF-02 y AQ-01 no cambian; su texto es el de la versión 1.0.

### RF-03 · Una autoevaluación por estudiante y partido (CR-03)
Para un mismo estudiante (mismo `idAnonimoHash`) y un mismo partido existe como máximo una
autoevaluación.
- Si llega otra con **las mismas escalas**, se trata como reintento de la cola offline: no se crea
  otro registro y se devuelve el id de la evaluación existente.
- Si llega otra con **escalas distintas**, se rechaza con `EVALUACION_YA_REGISTRADA` y se conserva
  la primera.

Origen: `validarUnicidad()` de `AutoevaluacionBienestar` en el diagrama de clases de diseño de
Software II y la restricción UNIQUE descrita en el Taller de arquitectura; reintento de la cola
offline de la PWA descrito en el mismo Taller.
