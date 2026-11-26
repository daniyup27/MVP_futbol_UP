// src/__tests__/persistencia/persistencia.integracion.test.ts
// FPI-III-14 · Bloques C y D: migración versionada, Data Mapper y pruebas de atomicidad,
// permanencia tras reinicio y escritura repetida contra PostgreSQL real (PGlite).
// Ejecutar: npx jest src/__tests__/persistencia --verbose
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { crearServicioBienestar } from '../../composicion/bienestar';
import { Partido } from '../../core/dominio/Partido';
import { RepositorioBienestarSql } from '../../infrastructure/adapters/RepositorioBienestarSql';
import { ValidadorPartidoEnMemoria } from '../../infrastructure/adapters/ValidadorPartidoEnMemoria';
import { aplicarMigraciones, leerMigraciones } from '../../infrastructure/persistencia/migraciones';
import { incumplimientosDelContrato } from '../contratos/contratoRepositorio';
import { ClienteSqlPGlite } from '../soporte/ClienteSqlPGlite';

jest.setTimeout(60000);

const HASH = 'c3'.repeat(32);

function validadorConPartido7() {
  const partido = Partido.programado('partido-7');
  partido.finalizar(2, 1);
  return new ValidadorPartidoEnMemoria([partido]);
}

async function contar(cliente: ClienteSqlPGlite): Promise<number> {
  const { rows } = await cliente.query<{ n: number }>('SELECT count(*)::int AS n FROM autoevaluacion_bienestar');
  return rows[0].n;
}

describe('Bloque C · migración versionada y esquema', () => {
  let cliente: ClienteSqlPGlite;
  beforeEach(async () => {
    cliente = await ClienteSqlPGlite.abrir();
  });
  afterEach(async () => cliente.cerrar());

  it('aplica 001 en una base vacía y no la repite en la segunda ejecución', async () => {
    expect(leerMigraciones().map((m) => m.nombre)).toEqual(['001_crear_autoevaluacion_bienestar.sql']);
    await expect(aplicarMigraciones(cliente)).resolves.toEqual([1]);
    await expect(aplicarMigraciones(cliente)).resolves.toEqual([]);
    const { rows } = await cliente.query<{ version: number }>('SELECT version FROM schema_migraciones');
    expect(rows.map((r) => r.version)).toEqual([1]);
  });

  it('la base también rechaza datos inválidos aunque se escriba sin pasar por la aplicación', async () => {
    await aplicarMigraciones(cliente);
    const insertar = (hash: string, escala: number) =>
      cliente.query(
        `INSERT INTO autoevaluacion_bienestar (id_anonimo_hash, id_partido, escala_fisica, escala_mental, fecha_registro)
         VALUES ($1, 'partido-7', $2, 3, now())`,
        [hash, escala]
      );
    await expect(insertar('1090000000'.padEnd(64, ' '), 4)).rejects.toThrow(/check/i);
    await expect(insertar(HASH, 6)).rejects.toThrow(/check/i);
    await insertar(HASH, 4);
    await expect(insertar(HASH, 4)).rejects.toMatchObject({ code: '23505' }); // UNIQUE (RF-03)
    expect(await contar(cliente)).toBe(1);
  });

  it('el Data Mapper informa RegistroConcurrenteError cuando la restricción UNIQUE rechaza el INSERT', async () => {
    await aplicarMigraciones(cliente);
    const repo = new RepositorioBienestarSql(cliente);
    const registro = { idAnonimoHash: HASH, idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3, fechaRegistro: new Date() };
    await expect(repo.guardarEvaluacion(registro)).resolves.toBe('1');
    await expect(repo.guardarEvaluacion(registro)).rejects.toMatchObject({ codigo: 'REGISTRO_CONCURRENTE' });
    expect(await contar(cliente)).toBe(1);
  });

  it('el Data Mapper cumple el mismo contrato que las otras implementaciones del repositorio', async () => {
    await aplicarMigraciones(cliente);
    await expect(incumplimientosDelContrato(new RepositorioBienestarSql(cliente))).resolves.toEqual([]);
  });
});

describe('Bloque D · atomicidad', () => {
  it('una migración que falla a mitad no deja la tabla creada ni la versión registrada', async () => {
    const cliente = await ClienteSqlPGlite.abrir();
    try {
      await aplicarMigraciones(cliente);
      const defectuosa = {
        version: 2,
        nombre: '002_prueba_fallo_intermedio.sql',
        sql: `CREATE TABLE tabla_de_prueba (id INT PRIMARY KEY);
              INSERT INTO tabla_de_prueba VALUES (1);
              SELECT 1 / 0;`,
      };
      await expect(aplicarMigraciones(cliente, [...leerMigraciones(), defectuosa])).rejects.toThrow(/division by zero/);
      const tabla = await cliente.query<{ existe: string | null }>("SELECT to_regclass('tabla_de_prueba')::text AS existe");
      expect(tabla.rows[0].existe).toBeNull();
      const versiones = await cliente.query<{ version: number }>('SELECT version FROM schema_migraciones ORDER BY version');
      expect(versiones.rows.map((r) => r.version)).toEqual([1]);
    } finally {
      await cliente.cerrar();
    }
  });
});

describe('Bloque D · permanencia tras reinicio', () => {
  it('lo confirmado se lee igual después de cerrar y volver a abrir la base', async () => {
    const directorio = fs.mkdtempSync(path.join(os.tmpdir(), 'mvp-futbol-pg-'));
    try {
      const primero = await ClienteSqlPGlite.abrir(directorio);
      await aplicarMigraciones(primero);
      const servicio = crearServicioBienestar({ repositorio: new RepositorioBienestarSql(primero), validador: validadorConPartido7() });
      const id = await servicio.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
      await primero.cerrar(); // "reinicio"

      const segundo = await ClienteSqlPGlite.abrir(directorio);
      await expect(aplicarMigraciones(segundo)).resolves.toEqual([]);
      const leida = await new RepositorioBienestarSql(segundo).buscarPorId(id);
      expect(leida).toMatchObject({ idPartido: 'partido-7', escalaFisica: 4, escalaMental: 3 });
      expect(leida?.idAnonimoHash).toMatch(/^[0-9a-f]{64}$/);
      expect(await contar(segundo)).toBe(1);
      await segundo.cerrar();
    } finally {
      fs.rmSync(directorio, { recursive: true, force: true });
    }
  });
});

describe('Bloque D · escritura repetida (RF-03)', () => {
  let cliente: ClienteSqlPGlite;
  beforeEach(async () => {
    cliente = await ClienteSqlPGlite.abrir();
    await aplicarMigraciones(cliente);
  });
  afterEach(async () => cliente.cerrar());

  const servicio = () =>
    crearServicioBienestar({ repositorio: new RepositorioBienestarSql(cliente), validador: validadorConPartido7() });

  it('reintento secuencial: mismo id y una sola fila', async () => {
    const s = servicio();
    const a = await s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    const b = await s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    expect(b).toBe(a);
    expect(await contar(cliente)).toBe(1);
  });

  it('dos reintentos simultáneos: los dos reciben el mismo id y queda una sola fila', async () => {
    const s = servicio();
    const [a, b] = await Promise.all([
      s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3),
      s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3),
    ]);
    expect(b).toBe(a);
    expect(await contar(cliente)).toBe(1);
  });

  it('lectura desactualizada (la otra petición guardó entre la consulta y el INSERT): se reintenta y devuelve el mismo id', async () => {
    const repo = new RepositorioBienestarSql(cliente);
    const s = crearServicioBienestar({ repositorio: repo, validador: validadorConPartido7() });
    const id = await s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3);
    // La primera consulta "no ve" la fila, como si la otra petición aún no hubiera confirmado.
    const original = repo.buscarPorEstudianteYPartido.bind(repo);
    let primera = true;
    jest.spyOn(repo, 'buscarPorEstudianteYPartido').mockImplementation(async (h, p) => {
      if (primera) {
        primera = false;
        return null;
      }
      return original(h, p);
    });
    const guardar = jest.spyOn(repo, 'guardarEvaluacion');
    await expect(s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3)).resolves.toBe(id);
    expect(guardar).toHaveBeenCalledTimes(1); // el INSERT chocó con UNIQUE y no se repitió
    expect(await contar(cliente)).toBe(1);
  });

  it('dos envíos simultáneos distintos: uno se guarda y el otro recibe EVALUACION_YA_REGISTRADA', async () => {
    const s = servicio();
    const resultados = await Promise.allSettled([
      s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 4, 3),
      s.registrarEvaluacion('estudiante-A', 't', 'partido-7', 2, 2),
    ]);
    expect(resultados.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rechazo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rechazo.reason).toMatchObject({ codigo: 'EVALUACION_YA_REGISTRADA' });
    expect(await contar(cliente)).toBe(1);
  });
});
