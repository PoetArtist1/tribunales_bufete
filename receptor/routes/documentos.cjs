/**
 * - Recibir documentos cifrados del emisor
 * - Listar documentos
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool.cjs');
const crypto = require('crypto');
const { generatePerFileKeyPair } = require('../crypto/keys.cjs');
const { decryptFile, decryptFilePrivateKey } = require('../crypto/decrypt.cjs');

function calcularHashSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Devuelve un id de documento y la clave pública RSA del receptor (por documento).
 * El receptor guarda el id y el par de claves en la base de datos.
 */
router.get('/public-key', async (req, res) => {
  try {
    const documentId = crypto.randomUUID();
    const { publicKeyPem, privateKeyPem } = generatePerFileKeyPair();
    await pool.query(
      `INSERT INTO documentos (document_id, public_key_pem, private_key_pem)
       VALUES ($1, $2, $3)`,
      [documentId, publicKeyPem, privateKeyPem],
    );
    res.json({ id: documentId, publicKeyPem });
  } catch (err) {
    console.error('Error obteniendo clave pública:', err);
    res.status(500).json({ error: 'No se pudo obtener la clave pública' });
  }
});

/**
 * Recibe un documento cifrado del emisor (JSON con buffers en base64)
 * Cuerpo esperado (JSON): { id, nombreOriginal, archivoCifradoB64, clavePrivadaCifradaB64, hashSha256 }
 */
router.post(
  '/documentos',
  express.json({ limit: '50mb' }),
  async (req, res) => {
    const {
      id,
      nombreOriginal,
      archivoCifradoB64,
      clavePrivadaCifradaB64,
      hashSha256,
    } = req.body;
    if (
      !id ||
      !nombreOriginal ||
      !archivoCifradoB64 ||
      !clavePrivadaCifradaB64 ||
      !hashSha256
    ) {
      return res.status(400).json({
        error:
          'Faltan campos: id, nombreOriginal, archivoCifradoB64, clavePrivadaCifradaB64, hashSha256',
      });
    }
    try {
      const archivoCifrado = Buffer.from(archivoCifradoB64, 'base64');
      const clavePrivadaCifrada = Buffer.from(clavePrivadaCifradaB64, 'base64');
      const client = await pool.connect();
      try {
        const existing = await client.query(
          'SELECT id, archivo_cifrado, private_key_pem FROM documentos WHERE document_id = $1',
          [id],
        );
        if (existing.rows.length === 0) {
          return res.status(404).json({ error: 'ID de documento no válido' });
        }
        if (existing.rows[0].archivo_cifrado) {
          return res
            .status(409)
            .json({ error: 'El documento ya fue recibido' });
        }
        if (!existing.rows[0].private_key_pem) {
          return res
            .status(409)
            .json({ error: 'No hay clave privada del receptor para este ID' });
        }

        // Desencripta la clave privada del archivo con la clave del receptor.
        const filePrivateKeyPem = decryptFilePrivateKey(
          clavePrivadaCifrada,
          existing.rows[0].private_key_pem,
        );
        // Desencripta el contenido y valida integridad con el hash enviado.
        const decrypted = decryptFile(archivoCifrado, filePrivateKeyPem);
        const computedHash = calcularHashSha256(decrypted);
        if (computedHash !== hashSha256) {
          return res
            .status(409)
            .json({ error: 'Fallo de integridad del documento' });
        }

        const result = await client.query(
          `UPDATE documentos
         SET nombre_original = $1,
             archivo_cifrado = $2,
             clave_privada_cifrada = $3,
             hash_sha256 = $4,
             fecha_recepcion = CURRENT_TIMESTAMP
         WHERE document_id = $5
         RETURNING document_id, nombre_original, fecha_recepcion`,
          [nombreOriginal, archivoCifrado, clavePrivadaCifrada, hashSha256, id],
        );
        const row = result.rows[0];
        res.status(201).json({
          id: row.document_id,
          nombreOriginal: row.nombre_original,
          fechaRecepcion: row.fecha_recepcion,
        });
      } finally {
        client.release();
      }
    } catch (err) {
      console.error('Error guardando documento:', err);
      res
        .status(500)
        .json({ error: 'Error al almacenar el documento cifrado' });
    }
  },
);

/**
 * Lista todos los documentos recibidos (sin desencriptar; solo metadatos).
 */
router.get('/documentos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT document_id, nombre_original, fecha_recepcion
       FROM documentos
       WHERE archivo_cifrado IS NOT NULL
       ORDER BY fecha_recepcion DESC`,
    );
    res.json(
      result.rows.map((r) => ({
        id: r.document_id,
        nombreOriginal: r.nombre_original,
        fechaRecepcion: r.fecha_recepcion,
      })),
    );
  } catch (err) {
    console.error('Error listando documentos:', err);
    res.status(500).json({ error: 'Error al listar documentos' });
  }
});

/**
 * Elimina un documento por id (incluye el cifrado y metadatos asociados).
 */
router.delete('/documentos/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM documentos
       WHERE document_id = $1
       RETURNING document_id, nombre_original`,
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    res.json({
      id: result.rows[0].document_id,
      nombreOriginal: result.rows[0].nombre_original,
    });
  } catch (err) {
    console.error('Error eliminando documento:', err);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
});

/**
 * Desencripta el documento con id dado y devuelve el contenido (para visualizar o descargar).
 */
router.get('/documentos/:id/decrypt', async (req, res) => {
  const forceDownload =
    req.query.download === '1' || req.query.download === 'true';
  try {
    const result = await pool.query(
      'SELECT nombre_original, archivo_cifrado, clave_privada_cifrada, hash_sha256, private_key_pem FROM documentos WHERE document_id = $1',
      [req.params.id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    const {
      nombre_original,
      archivo_cifrado,
      clave_privada_cifrada,
      hash_sha256,
      private_key_pem,
    } = result.rows[0];
    if (!archivo_cifrado || !clave_privada_cifrada || !private_key_pem) {
      return res.status(409).json({ error: 'Documento incompleto' });
    }

    // Desencripta clave y contenido para mostrar/descargar.
    const filePrivateKeyPem = decryptFilePrivateKey(
      clave_privada_cifrada,
      private_key_pem,
    );
    const decrypted = decryptFile(archivo_cifrado, filePrivateKeyPem);
    const computedHash = calcularHashSha256(decrypted);
    if (hash_sha256 && computedHash !== hash_sha256) {
      return res
        .status(409)
        .json({ error: 'Fallo de integridad del documento' });
    }
    if (forceDownload) {
      const filename = encodeURIComponent(nombre_original);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${filename}`,
      );
      res.setHeader('Content-Type', 'application/pdf');
      return res.send(decrypted);
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.send(decrypted);
  } catch (err) {
    console.error('Error desencriptando documento:', err);
    res.status(500).json({ error: 'Error al desencriptar el documento' });
  }
});

/**
 * Busca por nombre entre todos los documentos recibidos (sin desencriptar; solo metadatos).
 */
router.get('/documentos/buscar', async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT document_id, nombre_original, fecha_recepcion
       FROM documentos
       WHERE nombre_original ILIKE $1
         AND archivo_cifrado IS NOT NULL
       ORDER BY fecha_recepcion DESC`,
      [`%${q}%`],
    );

    res.json(
      result.rows.map((r) => ({
        id: r.document_id,
        nombreOriginal: r.nombre_original,
        fechaRecepcion: r.fecha_recepcion,
      })),
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

module.exports = router;
