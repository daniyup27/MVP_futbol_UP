// scripts/carga.mjs · FPI-III-15
// Prueba de carga sin dependencias: envía TOTAL autoevaluaciones con CONCURRENCIA peticiones
// simultáneas y resume latencias y códigos. Cada petición usa un estudiante sintético distinto
// (estudiante-carga-N), así que todas deberían terminar en 201 y en una fila nueva.
// Uso: BASE_URL=http://localhost:3000 JWT_SECRET=... TOTAL=200 CONCURRENCIA=5 ETIQUETA=nominal node scripts/carga.mjs
import { createHmac } from 'node:crypto';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TOTAL = Number(process.env.TOTAL ?? 200);
const CONCURRENCIA = Number(process.env.CONCURRENCIA ?? 5);
const PARTIDO = process.env.PARTIDO ?? 'partido-demo-1';
const PREFIJO = process.env.PREFIJO ?? 'carga';
const ETIQUETA = process.env.ETIQUETA ?? 'carga';
const SECRETO = process.env.JWT_SECRET;
if (!SECRETO) throw new Error('Falta JWT_SECRET');

const b64 = (x) => Buffer.from(x).toString('base64url');
function token(sub) {
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const c = b64(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `${h}.${c}.${createHmac('sha256', SECRETO).update(`${h}.${c}`).digest('base64url')}`;
}

const latencias = [];
const codigos = {};
let siguiente = 0;

async function trabajador() {
  while (siguiente < TOTAL) {
    const i = siguiente++;
    const t0 = performance.now();
    let codigo = 'ERROR_RED';
    try {
      const res = await fetch(`${BASE_URL}/api/bienestar/evaluaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(`estudiante-${PREFIJO}-${i}`)}` },
        body: JSON.stringify({ idPartido: PARTIDO, escalaFisica: (i % 5) + 1, escalaMental: ((i + 2) % 5) + 1 }),
      });
      await res.arrayBuffer();
      codigo = String(res.status);
    } catch {
      /* se cuenta como ERROR_RED */
    }
    latencias.push(performance.now() - t0);
    codigos[codigo] = (codigos[codigo] ?? 0) + 1;
  }
}

const inicio = performance.now();
await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));
const duracionMs = performance.now() - inicio;
latencias.sort((a, b) => a - b);
const pct = (p) => latencias[Math.min(latencias.length - 1, Math.ceil((p / 100) * latencias.length) - 1)];
const r = (x) => Math.round(x * 10) / 10;
console.log(JSON.stringify({
  etiqueta: ETIQUETA, total: TOTAL, concurrencia: CONCURRENCIA, duracionMs: Math.round(duracionMs),
  peticionesPorSegundo: r(TOTAL / (duracionMs / 1000)), p50ms: r(pct(50)), p95ms: r(pct(95)), p99ms: r(pct(99)),
  maxMs: r(latencias[latencias.length - 1]), codigos,
}));
