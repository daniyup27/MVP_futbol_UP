/**
 * Utilidad para anonimizar datos sensibles cumpliendo con la Ley 1581.
 * Refactorización preventiva: se extrae la lógica de hashing a una función pura 
 * para eliminar código duplicado y facilitar las pruebas unitarias.
 */

import crypto from 'crypto';

/**
 * Genera un hash SHA-256 seguro y anónimo a partir de un identificador.
 * @param identificador - El dato sensible original (ej. cédula, email).
 * @returns Un string hash anónimo.
 */
export function generarHashAnonimo(identificador: string): string {
  if (!identificador || typeof identificador !== 'string') {
    throw new Error('El identificador debe ser un string válido');
  }
  
  // Se usa un salt fijo del entorno o un valor por defecto seguro para el MVP
  const salt = process.env.ANONIMIZATION_SALT || 'mvp-futbol-up-salt-2026';
  
  return crypto
    .createHash('sha256')
    .update(`${salt}:${identificador}`)
    .digest('hex');
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
