# Catálogo de reglas del contexto de Bienestar (FPI-III-11)

| ID | Condición | Efecto | Dónde se protege | Consistencia | Evidencia |
|---|---|---|---|---|---|
| INV-01 | Una escala no es un entero entre 1 y 5 | No se crea la `EscalaBienestar`; error `DATOS_INVALIDOS` | `EscalaBienestar.crear` (objeto de valor) | Local al objeto | `objetosDeValor.test.ts` |
| INV-02 | El partido no está en `PROGRAMADO` cuando se llama `finalizar` | Rechazo `TRANSICION_INVALIDA`; estado y marcador intactos | `Partido.finalizar` (entidad) | Local a la entidad | `Partido.test.ts` |
| INV-03 | Ya existe una autoevaluación del mismo seudónimo y partido | Reintento igual: se devuelve el id existente sin escribir. Escalas distintas: `EVALUACION_YA_REGISTRADA` | `RegistroEvaluacionPartido.registrar` (raíz del agregado) | Inmediata dentro del agregado; entre peticiones simultáneas la garantiza la restricción UNIQUE (FPI-III-14) | `RegistroEvaluacionPartido.test.ts`, `unicidadEvaluacion.test.ts` |
| POL-01 | Partido no finalizado o inexistente | No se registra; `PARTIDO_NO_FINALIZADO` | `ServicioBienestar` con `IValidadorPartido` → `Partido.estaFinalizado` | Lectura previa (no cruza agregados en escritura) | `partidoYEvaluacion.test.ts` |
| SEG-01 | Cualquier autoevaluación | Solo se guarda el seudónimo, nunca `idEstudiante` | `ServicioBienestar` + `IAnonimizador`; `AutoevaluacionBienestar` no recibe el id | Local | `anonimizador.contrato.test.ts`, `bienestar.integration.test.ts` |
