-- Esquema de base de datos para el receptor (Tribunales)
-- Almacena documentos jurídicos siempre cifrados

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  document_id TEXT UNIQUE NOT NULL,
  nombre_original VARCHAR(500),
  archivo_cifrado BYTEA,                 -- Contenido cifrado con RSA-2048 por bloques
  clave_privada_cifrada BYTEA,           -- Llave privada del documento cifrada con RSA pública del receptor
  hash_sha256 TEXT,                      -- Hash SHA-256 del archivo en claro
  public_key_pem TEXT NOT NULL,          -- Clave pública del receptor (por documento)
  private_key_pem TEXT NOT NULL,         -- Clave privada del receptor (por documento, para desencriptar la llave privada)
  fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para consultas por fecha (listados ordenados)
CREATE INDEX IF NOT EXISTS idx_documentos_fecha ON documentos(fecha_recepcion DESC);

COMMENT ON TABLE documentos IS 'Documentos jurídicos recibidos, almacenados siempre cifrados';
COMMENT ON COLUMN documentos.archivo_cifrado IS 'Contenido del archivo cifrado con RSA-2048 por bloques';
COMMENT ON COLUMN documentos.clave_privada_cifrada IS 'Llave privada del documento cifrada con la clave pública RSA-2048 del receptor';
COMMENT ON COLUMN documentos.hash_sha256 IS 'Hash SHA-256 del archivo en claro para integridad';
COMMENT ON COLUMN documentos.public_key_pem IS 'Clave pública RSA del receptor generada para el documento';
COMMENT ON COLUMN documentos.private_key_pem IS 'Clave privada RSA del receptor generada para el documento';
