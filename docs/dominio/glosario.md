# Glosario del contexto de Bienestar (FPI-III-11)

| Término | Significado acordado | Ejemplo | Lo que NO es | Origen |
|---|---|---|---|---|
| Partido finalizado | Partido en estado `FINALIZADO`, al que ya se le registró marcador con `Partido.finalizar` | `partido-7` terminó 2-1 | Un partido con hora de fin pasada pero sin marcador | RF-02, diagrama de clases de Software II |
| Autoevaluación de bienestar | Respuesta de un estudiante sobre su estado físico y mental en un partido, con dos escalas enteras de 1 a 5 | Física 4, mental 3 | El formulario de la PWA (eso es la interfaz) | RF-02, contrato OpenAPI |
| Escala | Entero de 1 a 5 (`EscalaBienestar`) | 1 y 5 son válidos; 0, 6 y 3,5 no | Un porcentaje ni un texto | Contrato OpenAPI, FPI-III-08 |
| Seudónimo (`idAnonimoHash`) | HMAC-SHA256 del identificador del estudiante con un secreto; mismo estudiante, mismo valor | 64 caracteres hexadecimales | Un dato **anónimo**: con el secreto se puede volver a calcular | ADR-16 |
| Reintento | Envío repetido de la misma autoevaluación (mismo estudiante, partido y escalas), típicamente desde la cola offline | La PWA reenvía 4/3 tras perder señal | Una segunda autoevaluación con otras escalas | RF-03 (CR-03), Taller de arquitectura |
| Evaluación ya registrada | Segundo envío del mismo estudiante y partido con escalas distintas | Primero 4/3, luego 2/2 | Un reintento | RF-03 (CR-03) |
| Indisponibilidad | Una dependencia (validador o base) no respondió; la operación no se hizo y puede reintentarse | `ECONNREFUSED`, `P1001` | Un rechazo de negocio | FPI-III-06 |
