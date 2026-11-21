/**
 * Utilidad de seudonimización (Ley 1581 de 2012) — ADR-16.
 *
 * Se usa HMAC-SHA256 con un secreto externo (ANONIMIZATION_SALT) para que:
 *  - el mismo estudiante produzca siempre el mismo idAnonimoHash, lo que
 *    permite el seguimiento longitudinal de bienestar sin guardar su identidad;
 *  - sin el secreto no sea factible recalcular el hash a partir de una cédula.
 *
 * El secreto NO tiene valor por defecto: si falta, la función falla. Un valor
 * embebido en el código anularía la protección (cualquiera con el repositorio
 * podría recalcular los hashes).
 */

import { createHmac } from 'crypto';

export function obtenerSalt(): string {
  const salt = process.env.ANONIMIZATION_SALT;
  if (!salt || salt.length < 32) {
    throw new Error('ANONIMIZATION_SALT no configurado o con menos de 32 caracteres');
  }
  return salt;
}

/**
 * Genera el idAnonimoHash (64 caracteres hexadecimales) de un identificador.
 * @param identificador - Dato sensible original (p. ej. id institucional).
 */
export function generarHashAnonimo(identificador: string): string {
  if (!identificador || typeof identificador !== 'string') {
    throw new Error('El identificador debe ser un string válido');
  }
  return createHmac('sha256', obtenerSalt()).update(identificador).digest('hex');
}

/**
 * Ofusca un string mostrando solo los primeros y últimos caracteres.
 * Ej: "123456789" -> "123***789"
 */
export function ofuscarTexto(texto: string, visibles: number = 3): string {
  if (texto.length <= visibles * 2) return texto;
  const inicio = texto.substring(0, visibles);
  const fin = texto.substring(texto.length - visibles);
  return `${inicio}***${fin}`;
}
