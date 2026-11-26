// src/presentation/pwa/formularioEvaluacion.ts
// Presentación del flujo "registrar autoevaluación" para la PWA (FPI-III-14, bloque B).
// Lógica de pantalla sin framework: valida lo que el estudiante escribió antes de enviar y
// traduce la respuesta del servicio a un estado de interfaz con su mensaje. El componente
// visual (Next.js/React) solo tendría que pintar este estado.
import { RespuestaHttp } from '../http/evaluacionesHttp';

export interface EntradaFormulario {
  idPartido?: string | null;
  escalaFisica?: string | number | null;
  escalaMental?: string | number | null;
}

export type EstadoFormulario =
  | { tipo: 'EDITANDO'; errores: Partial<Record<'idPartido' | 'escalaFisica' | 'escalaMental', string>> }
  | { tipo: 'REGISTRADA'; mensaje: string; idEvaluacion: string; conservarEnCola: false }
  | { tipo: 'PENDIENTE_SINCRONIZACION'; mensaje: string; conservarEnCola: true }
  | { tipo: 'RECHAZADA'; mensaje: string; conservarEnCola: false }
  | { tipo: 'ERROR'; mensaje: string; conservarEnCola: false };

export interface DatosValidos {
  idPartido: string;
  escalaFisica: number;
  escalaMental: number;
}

function leerEscala(valor: string | number | null | undefined): number | null {
  if (valor === null || valor === undefined || String(valor).trim() === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : NaN;
}

/** Validación de forma en el cliente: ayuda al estudiante, no reemplaza la del servicio. */
export function validarFormulario(entrada: EntradaFormulario): { valido: true; datos: DatosValidos } | { valido: false; estado: EstadoFormulario } {
  const errores: Partial<Record<'idPartido' | 'escalaFisica' | 'escalaMental', string>> = {};
  if (!entrada.idPartido || entrada.idPartido.trim() === '') errores.idPartido = 'Selecciona el partido que jugaste.';
  const ef = leerEscala(entrada.escalaFisica);
  const em = leerEscala(entrada.escalaMental);
  if (ef === null) errores.escalaFisica = 'Marca cómo te sentiste físicamente (1 a 5).';
  else if (Number.isNaN(ef)) errores.escalaFisica = 'La escala física va de 1 a 5.';
  if (em === null) errores.escalaMental = 'Marca cómo te sentiste mentalmente (1 a 5).';
  else if (Number.isNaN(em)) errores.escalaMental = 'La escala mental va de 1 a 5.';
  if (Object.keys(errores).length > 0) return { valido: false, estado: { tipo: 'EDITANDO', errores } };
  return { valido: true, datos: { idPartido: entrada.idPartido!.trim(), escalaFisica: ef!, escalaMental: em! } };
}

/** Traduce la respuesta del servicio (o la falta de red) al estado que se muestra. */
export function estadoTrasEnvio(respuesta: RespuestaHttp | 'SIN_RED'): EstadoFormulario {
  if (respuesta === 'SIN_RED' || respuesta.status === 503) {
    return {
      tipo: 'PENDIENTE_SINCRONIZACION',
      mensaje: 'Guardamos tu autoevaluación en el teléfono y la enviaremos cuando haya conexión.',
      conservarEnCola: true,
    };
  }
  const codigo = respuesta.body.codigo;
  if (respuesta.status === 201) {
    return {
      tipo: 'REGISTRADA',
      mensaje: 'Tu autoevaluación quedó registrada. Gracias.',
      idEvaluacion: String(respuesta.body.idEvaluacion),
      conservarEnCola: false,
    };
  }
  if (codigo === 'DATOS_INVALIDOS' || codigo === 'FORMATO_INVALIDO') {
    return { tipo: 'EDITANDO', errores: { escalaFisica: 'Revisa las escalas: van de 1 a 5.' } };
  }
  const rechazos: Record<string, string> = {
    PARTIDO_NO_FINALIZADO: 'Este partido todavía no ha terminado. Podrás evaluarlo cuando finalice.',
    PARTIDO_NO_ENCONTRADO: 'No encontramos ese partido. Revisa que sea el correcto.',
    EVALUACION_YA_REGISTRADA: 'Ya registraste una autoevaluación distinta para este partido.',
    NO_AUTENTICADO: 'Tu sesión venció. Vuelve a iniciar sesión para enviar la autoevaluación.',
  };
  if (typeof codigo === 'string' && rechazos[codigo]) {
    return { tipo: 'RECHAZADA', mensaje: rechazos[codigo], conservarEnCola: false };
  }
  return { tipo: 'ERROR', mensaje: 'Algo salió mal de nuestro lado. Intenta más tarde.', conservarEnCola: false };
}
