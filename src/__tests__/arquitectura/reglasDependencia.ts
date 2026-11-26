// src/__tests__/arquitectura/reglasDependencia.ts
//
// Regla verificable de dependencias entre capas (FPI-III-05).
// Lee los import/export ... from de cada archivo .ts de src (sin pruebas),
// resuelve rutas relativas y clasifica origen y destino por capa.
import * as fs from 'fs';
import * as path from 'path';

export type Capa = 'presentacion' | 'nucleo' | 'infraestructura' | 'transversal' | 'externo';

export interface Dependencia {
  origen: string; // ruta relativa a la raíz del repo
  destino: string; // ruta relativa o nombre del paquete
  capaOrigen: Capa;
  capaDestino: Capa;
}

// Paquetes que solo puede conocer infraestructura o presentación.
export const PAQUETES_DE_INFRAESTRUCTURA = ['pino', '@opentelemetry/', '@prisma/client', 'next', 'pg'];

export function capaDeArchivo(rutaRelativa: string): Capa {
  const r = rutaRelativa.replace(/\\/g, '/');
  if (r.startsWith('src/app/') || r.startsWith('src/presentation/')) return 'presentacion';
  if (r.startsWith('src/core/') || r.startsWith('src/config/')) return 'nucleo';
  if (r.startsWith('src/infrastructure/') || r.startsWith('src/telemetry/')) return 'infraestructura';
  if (r.startsWith('src/utils/') || r.startsWith('src/composicion')) return 'transversal';
  return 'externo';
}

function listarFuentes(dir: string): string[] {
  const salida: string[] = [];
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      if (entrada.name === '__tests__' || entrada.name === 'node_modules') continue;
      salida.push(...listarFuentes(ruta));
    } else if (entrada.name.endsWith('.ts') && !entrada.name.endsWith('.test.ts')) {
      salida.push(ruta);
    }
  }
  return salida;
}

function resolverRelativo(desde: string, especificador: string): string {
  const base = path.resolve(path.dirname(desde), especificador);
  for (const candidato of [base + '.ts', path.join(base, 'index.ts'), base]) {
    if (fs.existsSync(candidato)) return candidato;
  }
  return base + '.ts';
}

export function leerDependencias(raiz: string): Dependencia[] {
  const deps: Dependencia[] = [];
  const patron = /(?:import|export)\s[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
  for (const archivo of listarFuentes(path.join(raiz, 'src'))) {
    const origen = path.relative(raiz, archivo).replace(/\\/g, '/');
    const texto = fs.readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(patron)) {
      const espec = m[1] ?? m[2];
      if (espec.startsWith('.')) {
        const destino = path.relative(raiz, resolverRelativo(archivo, espec)).replace(/\\/g, '/');
        deps.push({ origen, destino, capaOrigen: capaDeArchivo(origen), capaDestino: capaDeArchivo(destino) });
      } else {
        deps.push({ origen, destino: espec, capaOrigen: capaDeArchivo(origen), capaDestino: 'externo' });
      }
    }
  }
  return deps;
}

/**
 * Regla:
 *  1. El núcleo (src/core, src/config) no importa presentación ni infraestructura.
 *  2. El núcleo no importa paquetes de infraestructura (pino, OpenTelemetry, Prisma, Next, pg).
 *  3. Infraestructura no importa presentación.
 */
export function violaciones(deps: Dependencia[]): string[] {
  const salida: string[] = [];
  for (const d of deps) {
    if (d.capaOrigen === 'nucleo' && (d.capaDestino === 'presentacion' || d.capaDestino === 'infraestructura')) {
      salida.push(`${d.origen} -> ${d.destino} (núcleo no conoce ${d.capaDestino})`);
    }
    if (d.capaOrigen === 'nucleo' && d.capaDestino === 'externo' &&
        PAQUETES_DE_INFRAESTRUCTURA.some((p) => d.destino === p || d.destino.startsWith(p.endsWith('/') ? p : p + '/'))) {
      salida.push(`${d.origen} -> ${d.destino} (paquete de infraestructura en el núcleo)`);
    }
    if (d.capaOrigen === 'infraestructura' && d.capaDestino === 'presentacion') {
      salida.push(`${d.origen} -> ${d.destino} (infraestructura no conoce presentación)`);
    }
  }
  return salida;
}

/**
 * Regla 4 (FPI-III-07): el núcleo no lee variables de entorno, ni directamente
 * ni a través de un módulo local que importe. La configuración se resuelve en
 * la raíz de composición y llega al núcleo como un puerto ya construido.
 */
export function lecturasDeEntornoDesdeNucleo(raiz: string, deps: Dependencia[]): string[] {
  const salida: string[] = [];
  const leeEntorno = (rel: string) => {
    const ruta = path.join(raiz, rel);
    return fs.existsSync(ruta) && /process\.env/.test(fs.readFileSync(ruta, 'utf8'));
  };
  const nucleo = new Set(deps.filter((d) => d.capaOrigen === 'nucleo').map((d) => d.origen));
  for (const archivo of nucleo) {
    if (leeEntorno(archivo)) salida.push(`${archivo} lee process.env`);
  }
  for (const d of deps) {
    if (d.capaOrigen === 'nucleo' && d.capaDestino !== 'nucleo' && d.capaDestino !== 'externo' && leeEntorno(d.destino)) {
      salida.push(`${d.origen} -> ${d.destino} (el destino lee process.env)`);
    }
  }
  return salida;
}
