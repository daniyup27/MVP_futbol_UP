// src/__tests__/arquitectura/trazabilidad.test.ts
// FPI-III-10 · La matriz de trazabilidad se verifica contra el repositorio en cada ejecución.
//  - todo requisito de la ERS vigente aparece en la matriz;
//  - un requisito "verificado" tiene componentes y pruebas que existen de verdad;
//  - un requisito "pendiente" queda listado para que no se olvide.
import * as fs from 'fs';
import * as path from 'path';

const RAIZ = path.resolve(__dirname, '../../..');
const matriz = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs/requisitos/matriz-trazabilidad.json'), 'utf8')) as {
  version: string;
  ers: string;
  requisitos: { id: string; componentes: string[]; pruebas: string[]; estado: 'verificado' | 'pendiente' }[];
};

describe(`Matriz de trazabilidad v${matriz.version}`, () => {
  const ers = fs.readFileSync(path.join(RAIZ, matriz.ers), 'utf8');
  const idsErs = new Set(ers.match(/\b(RF|AQ)-\d{2}\b/g) ?? []);

  it('cubre todos los requisitos de la ERS vigente', () => {
    const idsMatriz = new Set(matriz.requisitos.map((r) => r.id));
    expect([...idsErs].filter((id) => !idsMatriz.has(id))).toEqual([]);
  });

  it.each(matriz.requisitos.filter((r) => r.estado === 'verificado').map((r) => [r.id, r] as const))(
    '%s verificado: sus componentes y pruebas existen',
    (_id, r) => {
      expect(r.componentes.length).toBeGreaterThan(0);
      expect(r.pruebas.length).toBeGreaterThan(0);
      const faltantes = [...r.componentes, ...r.pruebas].filter((f) => !fs.existsSync(path.join(RAIZ, f)));
      expect(faltantes).toEqual([]);
    }
  );

  it('deja visibles los requisitos pendientes', () => {
    const pendientes = matriz.requisitos.filter((r) => r.estado === 'pendiente').map((r) => r.id);
    // Se actualiza cuando un requisito pasa a verificado.
    // RF-03 pasó a verificado en FPI-III-11 (CP-03).
    expect(pendientes).toEqual([]);
  });
});
