// Configuración de torneos - Soporta múltiples modalidades
export const TOURNAMENT_CONFIG = {
  // Torneo tradicional de fútbol (reglamento universitario estándar)
  TRADITIONAL: {
    MAX_PLAYERS_PER_TEAM: 15,
    MIN_PLAYERS_TO_START: 7,
    MATCH_DURATION_MINUTES: 90,
    ALLOWED_SUBSTITUTIONS: 3,
    DEFAULT_TOURNAMENT_NAME: "Torneo Semestral 2026-II"
  },
  
  // Torneo de bienestar (reglas flexibles para participación masiva)
  WELLBEING: {
    MAX_PLAYERS_PER_TEAM: 11,
    MIN_PLAYERS_TO_START: 5,
    MATCH_DURATION_MINUTES: 80,
    ALLOWED_SUBSTITUTIONS: 5,
    DEFAULT_TOURNAMENT_NAME: "Torneo de Bienestar 2026-II"
  }
};

// Configuración por defecto (se puede cambiar según el tipo de torneo)
export const DEFAULT_CONFIG = TOURNAMENT_CONFIG.TRADITIONAL;