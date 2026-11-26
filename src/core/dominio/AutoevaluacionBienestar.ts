// src/core/dominio/AutoevaluacionBienestar.ts
// Entidad del diagrama de clases (AutoevaluacionBienestar). Agrupa las dos escalas
// como objetos de valor y el hash ya calculado; nunca recibe el idEstudiante.
// Su identidad (id_evaluacion) la asigna la persistencia al guardarla.
import { EvaluacionAnonima } from '../ports/IRepositorioBienestar';
import { EscalaBienestar } from './EscalaBienestar';
import { InvarianteVioladaError } from '../errores';

// ADR-16: el seudónimo es un HMAC-SHA256 en hexadecimal.
const FORMATO_SEUDONIMO = /^[0-9a-f]{64}$/;

export class AutoevaluacionBienestar {
  private constructor(
    readonly idAnonimoHash: string,
    readonly idPartido: string,
    readonly escalaFisica: EscalaBienestar,
    readonly escalaMental: EscalaBienestar,
    readonly fechaRegistro: Date
  ) {
    Object.freeze(this);
  }

  /**
   * Método de creación nombrado (FPI-III-13). Una autoevaluación nace completa o no nace:
   *  - seudónimo con el formato de ADR-16 (64 hex), nunca un identificador en claro;
   *  - idPartido no vacío;
   *  - dos escalas válidas (EscalaBienestar);
   *  - fecha de registro válida.
   */
  static registrar(datos: {
    idAnonimoHash: string;
    idPartido: string;
    escalaFisica: number;
    escalaMental: number;
    fechaRegistro?: Date;
  }): AutoevaluacionBienestar {
    if (!FORMATO_SEUDONIMO.test(datos.idAnonimoHash ?? '')) {
      throw new InvarianteVioladaError('idAnonimoHash debe ser un seudónimo HMAC-SHA256 de 64 caracteres hexadecimales');
    }
    if (typeof datos.idPartido !== 'string' || datos.idPartido.trim() === '') {
      throw new InvarianteVioladaError('idPartido es obligatorio');
    }
    const fecha = datos.fechaRegistro ?? new Date();
    if (Number.isNaN(fecha.getTime())) {
      throw new InvarianteVioladaError('fechaRegistro no es una fecha válida');
    }
    return new AutoevaluacionBienestar(
      datos.idAnonimoHash,
      datos.idPartido,
      EscalaBienestar.crear(datos.escalaFisica, 'escalaFisica'),
      EscalaBienestar.crear(datos.escalaMental, 'escalaMental'),
      fecha
    );
  }

  /** Reconstruye la entidad a partir de lo que devuelve la persistencia. */
  static reconstituir(registro: EvaluacionAnonima): AutoevaluacionBienestar {
    return AutoevaluacionBienestar.registrar(registro);
  }

  /** FPI-III-11: dos autoevaluaciones dicen lo mismo si sus escalas son iguales (objetos de valor). */
  mismasRespuestas(otra: AutoevaluacionBienestar): boolean {
    return this.escalaFisica.equals(otra.escalaFisica) && this.escalaMental.equals(otra.escalaMental);
  }

  /** Forma plana que espera el puerto de persistencia. */
  aRegistro(): EvaluacionAnonima {
    return {
      idAnonimoHash: this.idAnonimoHash,
      idPartido: this.idPartido,
      escalaFisica: this.escalaFisica.valor,
      escalaMental: this.escalaMental.valor,
      fechaRegistro: this.fechaRegistro,
    };
  }
}
