# FPI-III-09 · Contrato compartido del repositorio de evaluaciones

Rama: `swiii/g09-contrato-repositorio` (parte de `swiii/g08-modelo-dominio`).
Es el problema que FPI-III-07 dejó **priorizado**.

## Problema real

`src/infrastructure/adapters/RepositorioBienestarPrisma.ts` hasta `swiii/g08-modelo-dominio`:

```ts
constructor(private dbClient: any) {}
async guardarEvaluacion(evaluacion) {
  // Aquí iría: this.dbClient.autoevaluacionBienestar.create({ data: evaluacion })
  const idGenerado = `db-id-${Date.now()}`;
  console.log(`[Adapter] Evaluación guardada con hash: ${evaluacion.idAnonimoHash}`);
  return idGenerado;
}
```

| Principio | Cómo se incumplía |
|---|---|
| Sustitución de Liskov | El puerto promete que el id devuelto corresponde a una evaluación guardada. El adaptador devuelve un id inventado sin escribir nada: es la misma "confirmación falsa" del Notificador del caso de la ferretería. Cualquier prueba que lo use pasa aunque no persista. |
| Segregación de interfaces | Depende de `any`: en la práctica, de todo el `PrismaClient`, sin decir qué parte usa. Tampoco había forma de leer lo guardado sin agregar ese método al puerto que usa el caso de uso. |
| Responsabilidad única (efecto secundario) | Además de persistir, escribe en consola el `idAnonimoHash`, que es un dato seudonimizado (ADR-16) y no debe aparecer en logs. |

## Cambio

- `RepositorioBienestarPrisma` depende de `ClienteAutoevaluaciones`, una interfaz con solo
  `autoevaluacionBienestar.create` y `findUnique`. El `PrismaClient` real la cumple cuando se
  instale Prisma; en pruebas la cumple `ClientePrismaFalso`.
- Devuelve el `id` que asigna la base. Ya no hay éxito sin escritura.
- Traduce `ECONNREFUSED`, `ETIMEDOUT` y el código de Prisma `P1001` a `DependenciaNoDisponibleError`.
- Sin `console.log`; el log lo hace `RegistroEvaluacionInstrumentado` (FPI-III-05) sin datos del estudiante.
- Nuevo puerto de lectura `IConsultaEvaluaciones.buscarPorId`. `ServicioBienestar` sigue dependiendo
  solo de `IRepositorioBienestar` (escritura).

Diagramas: `docs/diagramas/repositorio-g09-antes.mmd` y `repositorio-g09-despues.mmd` (con `.png`).

## Contrato compartido (`src/__tests__/contratos/contratoRepositorio.ts`)

| Expectativa | Entrada | Efecto permitido |
|---|---|---|
| Devuelve un id no vacío | `evaluacionDeEjemplo()` | Una escritura |
| Ids distintos por registro | Dos evaluaciones | Dos escrituras |
| Lo guardado se puede recuperar | `buscarPorId(id)` | Solo lectura |
| Se recupera sin cambios | Comparación campo a campo | — |
| No agrega datos personales | `idEstudiante` ausente | — |
| Id inexistente devuelve `null` | `buscarPorId('no-existe')` | — |

```bash
npx jest src/__tests__/contratos src/__tests__/integration/registroConPrisma.test.ts --verbose
```

| Comprobación | Resultado |
|---|---|
| Contrato con `RepositorioBienestarEnMemoria` | 6 de 6 |
| Contrato con `RepositorioBienestarPrisma` + `ClientePrismaFalso` | 6 de 6 |
| Lógica del adaptador anterior (control negativo) | Incumple "lo guardado se puede recuperar" |
| Específica Prisma: fila escrita con hash y sin `idEstudiante` | Aprobada |
| Específica Prisma: `P1001` → `DependenciaNoDisponibleError`, 0 filas | Aprobada |
| Específica Prisma: no escribe en consola | Aprobada |
| Regresión HTTP con Prisma: 201 con `db-1` y 503 con base caída | Aprobada |
| Suite completa | 16 suites, 76 pruebas |

El adaptador anterior no podía ejecutar el contrato tal cual porque no tenía `buscarPorId`; por eso
el control negativo reproduce su lógica en la prueba.

## Limitaciones

- No hay base PostgreSQL ni Prisma instalados en el repositorio. El contrato se verifica contra un
  cliente falso con la forma del cliente de Prisma, no contra la base real. Cuando se agregue Prisma,
  la misma función `incumplimientosDelContrato` debe ejecutarse contra la base efímera de ADR-07.
- `create({ data })` asume que el modelo de Prisma usará los mismos nombres de campo que
  `EvaluacionAnonima`, como indicaba el comentario original del adaptador.
