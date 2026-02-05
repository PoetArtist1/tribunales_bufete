-- Esquema de base de datos para el receptor (Tribunales)
-- Almacena documentos jurídicos siempre cifrados

CREATE TABLE IF NOT EXISTS documentos (
  id SERIAL PRIMARY KEY,
  nombre_original VARCHAR(500) NOT NULL,
  archivo_cifrado BYTEA NOT NULL,        -- Contenido cifrado con AES-256
  clave_aes_cifrada BYTEA NOT NULL,      -- Clave AES cifrada con RSA-2048 pública del receptor
  fecha_recepcion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  -- El IV y authTag están incluidos en archivo_cifrado: [IV 16 bytes][ciphertext][authTag 16 bytes]
);

-- Índice para consultas por fecha (listados ordenados)
CREATE INDEX IF NOT EXISTS idx_documentos_fecha ON documentos(fecha_recepcion DESC);

COMMENT ON TABLE documentos IS 'Documentos jurídicos recibidos, almacenados siempre cifrados';
COMMENT ON COLUMN documentos.archivo_cifrado IS 'Contenido del archivo cifrado con AES-256-GCM';
COMMENT ON COLUMN documentos.clave_aes_cifrada IS 'Clave simétrica AES cifrada con la clave pública RSA-2048 del receptor';
