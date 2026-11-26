# ERS · Módulo de Bienestar y Torneos · versión 1.0 (congelada)

| Campo | Valor |
|---|---|
| Versión | 1.0 |
| Estado | Congelada el 2026-11-25 para la revisión de diseño RD-01 |
| Base de código | rama `swiii/g09-contrato-repositorio`, commit `3f2cab6` |
| Origen | Matriz de FPI-III-01 (RF-01, RF-02, AQ-01), CR-01 incremento 1 (FUTSAL), ADR-16 |
| Aprobación | Product Owner (Stefanny Fajardo). Aliado: Dependencia de Bienestar Universitario |

## Requisitos

### RF-01 · Validar cantidad de jugadores por modalidad
Al inscribir un equipo, el sistema acepta la cantidad de jugadores solo si está dentro del rango de
su modalidad: TRADITIONAL 7 a 15, WELLBEING 5 a 11 y FUTSAL 5 a 12 (CR-01, incremento 1).
Fuera de rango, se rechaza con un mensaje que indica el rango.

### RF-02 · Registrar autoevaluación de bienestar
Un estudiante autenticado registra su autoevaluación física y mental de un partido. Cada escala es
un entero de 1 a 5. Solo se acepta si el partido está finalizado. Si el validador o la base no
responden, el sistema lo informa como indisponibilidad y no guarda nada.

### AQ-01 · Privacidad de la autoevaluación (Ley 1581 de 2012)
Fuente: estudiante · Estímulo: envía su autoevaluación · Artefacto: servicio de bienestar y
persistencia · Respuesta: se guarda solo el seudónimo `idAnonimoHash` (HMAC-SHA256, ADR-16).
Medida: 0 campos `idEstudiante`, `cedula` o `nombre` en lo persistido y en la respuesta HTTP;
hash de 64 caracteres hexadecimales en el 100 % de las ejecuciones.

## Supuestos
- La autenticación entrega el identificador del estudiante en el claim `sub` del token.
- El estado del partido lo conoce el módulo de torneos y se consulta por un puerto.
