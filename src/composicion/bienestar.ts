// src/composicion/bienestar.ts
// Raíz de composición del módulo de bienestar (FPI-III-07).
// Aquí, y solo aquí, se eligen las implementaciones concretas de los puertos.
import { ServicioBienestar } from '../core/ServicioBienestar';
import { IAnonimizador } from '../core/ports/IAnonimizador';
import { IRepositorioBienestar } from '../core/ports/IRepositorioBienestar';
import { IValidadorPartido } from '../core/ports/IValidadorPartido';
import { AnonimizadorHmac } from '../infrastructure/seguridad/AnonimizadorHmac';

export interface PuertosBienestar {
  repositorio: IRepositorioBienestar;
  validador: IValidadorPartido;
  anonimizador?: IAnonimizador;
}

export function crearServicioBienestar(puertos: PuertosBienestar): ServicioBienestar {
  const anonimizador = puertos.anonimizador ?? AnonimizadorHmac.desdeEntorno();
  return new ServicioBienestar(puertos.repositorio, puertos.validador, anonimizador);
}
