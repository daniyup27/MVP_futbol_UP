# ERS · Módulo de Bienestar y Torneos · versión 1.2

| Campo | Valor |
|---|---|
| Versión | 1.2 |
| Cambios frente a 1.1 | RF-02 distingue partido inexistente de partido no finalizado (hallazgo H-02 de RD-01) |
| Estado | Aprobada por el Product Owner el 2026-11-25 |
| Documentos previos | `ERS-bienestar-v1.0.md`, `ERS-bienestar-v1.1.md` (se conservan sin cambios) |

RF-01, RF-03 y AQ-01 no cambian frente a la versión 1.1.

### RF-02 · Registrar autoevaluación de bienestar (modificado)
Un estudiante autenticado registra su autoevaluación física y mental de un partido. Cada escala es
un entero de 1 a 5. Solo se acepta si el partido está finalizado.
- Si el partido no existe, se rechaza con `PARTIDO_NO_ENCONTRADO` (nuevo en 1.2).
- Si existe pero no está finalizado, se rechaza con `PARTIDO_NO_FINALIZADO`.
- Si el validador o la base no responden, se informa como indisponibilidad y no se guarda nada.

Origen del cambio: Taller de arquitectura de Software II, Tabla 4 ("partido inexistente": se rechaza
con un error descriptivo), y hallazgo H-02 de `docs/revisiones/RD-01-revision-diseno-bienestar.md`.
