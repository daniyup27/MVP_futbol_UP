// src/core/dominio/AutoevaluacionBienestar.ts
// Entidad del diagrama de clases (AutoevaluacionBienestar). Agrupa las dos escalas
// como objetos de valor y el hash ya calculado; nunca recibe el idEstudiante.
// Su identidad (id_evaluacion) la asigna la persistencia al guardarla.
import { EvaluacionAnonima } from '../ports/IRepositorioBienestar';
import { EscalaBienestar } from './EscalaBienestar';

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

  static registrar(datos: {
    idAnonimoHash: string;
    idPartido: string;
    escalaFisica: number;
    escalaMental: number;
    fechaRegistro?: Date;
  }): AutoevaluacionBienestar {
    return new AutoevaluacionBienestar(
      datos.idAnonimoHash,
      datos.idPartido,
      EscalaBienestar.crear(datos.escalaFisica, 'escalaFisica'),
      EscalaBienestar.crear(datos.escalaMental, 'escalaMental'),
      datos.fechaRegistro ?? new Date()
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
