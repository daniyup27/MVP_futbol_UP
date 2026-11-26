-- 001 · Tabla de autoevaluaciones de bienestar (FPI-III-14)
-- Nombres de columnas tomados del diagrama de clases de diseño de Software II
-- (id_evaluacion, id_anonimo_hash, escala_fisica, escala_mental, fecha_registro).
-- Las restricciones repiten en la base las invariantes del dominio para que se cumplan
-- también bajo concurrencia o si alguien escribe sin pasar por la aplicación.
CREATE TABLE autoevaluacion_bienestar (
  id_evaluacion   BIGSERIAL PRIMARY KEY,
  id_anonimo_hash CHAR(64)    NOT NULL CHECK (id_anonimo_hash ~ '^[0-9a-f]{64}$'),   -- ADR-16
  id_partido      TEXT        NOT NULL CHECK (length(trim(id_partido)) > 0),
  escala_fisica   SMALLINT    NOT NULL CHECK (escala_fisica BETWEEN 1 AND 5),       -- RF-02
  escala_mental   SMALLINT    NOT NULL CHECK (escala_mental BETWEEN 1 AND 5),       -- RF-02
  fecha_registro  TIMESTAMPTZ NOT NULL,
  CONSTRAINT uq_evaluacion_estudiante_partido UNIQUE (id_anonimo_hash, id_partido)  -- RF-03
);
