// src/infrastructure/seguridad/AnonimizadorHmac.ts
// Adaptador de IAnonimizador basado en HMAC-SHA256 (ADR-16).
// Reutiliza src/utils/anonimizar.ts sin modificarlo: el algoritmo y el secreto
// son los mismos, solo cambia QUIÉN conoce la variable de entorno. El secreto se
// valida al construir el adaptador (en el arranque) y no en cada petición.
import { IAnonimizador } from '../../core/ports/IAnonimizador';
import { generarHashAnonimo, obtenerSalt } from '../../utils/anonimizar';

export class AnonimizadorHmac implements IAnonimizador {
  private constructor() {}

  /** Falla en el arranque si ANONIMIZATION_SALT falta o tiene menos de 32 caracteres. */
  static desdeEntorno(): AnonimizadorHmac {
    obtenerSalt();
    return new AnonimizadorHmac();
  }

  generarHash(idEstudiante: string): string {
    return generarHashAnonimo(idEstudiante);
  }
}
