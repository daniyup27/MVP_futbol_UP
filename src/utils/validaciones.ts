/**
 * Módulo de validaciones centralizadas
 * Refactorización preventiva: extrae lógica duplicada a funciones puras
 * para mejorar mantenibilidad y facilitar tests unitarios.
 */

export interface ValidacionCampo {
  esValido: boolean;
  mensaje?: string;
}

/**
 * Valida que un string no esté vacío o null
 */
export function validarStringNoVacio(valor: string | null | undefined): ValidacionCampo {
  if (!valor || valor.trim() === '') {
    return { esValido: false, mensaje: 'El campo no puede estar vacío' };
  }
  return { esValido: true };
}

/**
 * Valida que un número esté en un rango específico
 */
export function validarRango(
  valor: number,
  minimo: number,
  maximo: number,
  nombreCampo: string
): ValidacionCampo {
  if (valor < minimo || valor > maximo) {
    return {
      esValido: false,
      mensaje: `${nombreCampo} debe estar entre ${minimo} y ${maximo}`
    };
  }
  return { esValido: true };
}

/**
 * Valida formato de email básico
 */
export function validarEmail(email: string): ValidacionCampo {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regexEmail.test(email)) {
    return { esValido: false, mensaje: 'Email inválido' };
  }
  return { esValido: true };
}
