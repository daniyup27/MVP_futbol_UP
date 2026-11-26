// src/infrastructure/seguridad/verificarJwt.ts
// Verificación mínima de un JWT HS256 (FPI-III-15) para el servidor Node sin Next.js.
// Devuelve el claim `sub` solo si el algoritmo es HS256, la firma coincide y no ha vencido.
// No registra el token ni el sub: el sub es el identificador del estudiante (Ley 1581).
import { createHmac, timingSafeEqual } from 'crypto';

function base64url(datos: Buffer | string): string {
  return Buffer.from(datos).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function leerJson(parte: string): Record<string, unknown> | null {
  try {
    const valor = JSON.parse(Buffer.from(parte, 'base64url').toString('utf8'));
    return typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function verificarJwtHs256(token: string, secreto: string, ahora = Date.now()): string | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [cabecera, carga, firma] = partes;
  const h = leerJson(cabecera);
  if (!h || h.alg !== 'HS256') return null;
  const esperada = Buffer.from(base64url(createHmac('sha256', secreto).update(`${cabecera}.${carga}`).digest()));
  const recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  const c = leerJson(carga);
  if (!c || typeof c.sub !== 'string' || c.sub === '') return null;
  if (typeof c.exp === 'number' && c.exp * 1000 <= ahora) return null;
  return c.sub;
}

/** Solo para pruebas y para el script de carga: firma un token HS256. */
export function firmarJwtHs256(carga: Record<string, unknown>, secreto: string): string {
  const cabecera = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = base64url(JSON.stringify(carga));
  return `${cabecera}.${cuerpo}.${base64url(createHmac('sha256', secreto).update(`${cabecera}.${cuerpo}`).digest())}`;
}
