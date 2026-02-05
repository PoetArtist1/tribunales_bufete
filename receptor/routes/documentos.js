/**
 * - Recibir documentos cifrados del emisor
 * - Listar documentos
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db/pool');
const { getPublicKeyPem } = require('../crypto/keys');
const { decryptFile } = require('../crypto/decrypt');

/**
 * Devuelve la clave pública RSA del receptor en PEM.
 * El emisor la usa para cifrar la clave AES antes de enviar el archivo
 */
router.get('/public-key', (req, res) => {
  try {
    const publicKeyPem = getPublicKeyPem();
    res.type('application/x-pem-file').send(publicKeyPem);
  } catch (err) {
    console.error('Error obteniendo clave pública:', err);
    res.status(500).json({ error: 'No se pudo obtener la clave pública' });
  }
});

/**
 * Recibe un documento cifrado del emisor (multipart o JSON con buffers en base64)
 * Cuerpo esperado (JSON): { nombreOriginal, archivoCifradoB64, claveAesCifradaB64 }
 */
router.post('/documentos', express.json({ limit: '50mb' }), async (req, res) => {
  const { nombreOriginal, archivoCifradoB64, claveAesCifradaB64 } = req.body;
  if (!nombreOriginal || !archivoCifradoB64 || !claveAesCifradaB64) {
    return res.status(400).json({
      error: 'Faltan campos: nombreOriginal, archivoCifradoB64, claveAesCifradaB64',
    });
  }
  try {
    const archivoCifrado = Buffer.from(archivoCifradoB64, 'base64');
    const claveAesCifrada = Buffer.from(claveAesCifradaB64, 'base64');
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO documentos (nombre_original, archivo_cifrado, clave_aes_cifrada)
         VALUES ($1, $2, $3)
         RETURNING id, nombre_original, fecha_recepcion`,
        [nombreOriginal, archivoCifrado, claveAesCifrada]
      );
      const row = result.rows[0];
      res.status(201).json({
        id: row.id,
        nombreOriginal: row.nombre_original,
        fechaRecepcion: row.fecha_recepcion,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error guardando documento:', err);
    res.status(500).json({ error: 'Error al almacenar el documento cifrado' });
  }
});

/**
 * Lista todos los documentos recibidos (sin desencriptar; solo metadatos).
 */
router.get('/documentos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_original, fecha_recepcion
       FROM documentos
       ORDER BY fecha_recepcion DESC`
    );
    res.json(
      result.rows.map((r) => ({
        id: r.id,
        nombreOriginal: r.nombre_original,
        fechaRecepcion: r.fecha_recepcion,
      }))
    );
  } catch (err) {
    console.error('Error listando documentos:', err);
    res.status(500).json({ error: 'Error al listar documentos' });
  }
});

/**
 * Desencripta el documento con id dado y devuelve el contenido (para visualizar o descargar).
 */
router.get('/documentos/:id/decrypt', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const forceDownload = req.query.download === '1' || req.query.download === 'true';
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID de documento inválido' });
  }
  try {
    const result = await pool.query(
      'SELECT nombre_original, archivo_cifrado, clave_aes_cifrada FROM documentos WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    const { nombre_original, archivo_cifrado, clave_aes_cifrada } = result.rows[0];
    const decrypted = decryptFile(archivo_cifrado, clave_aes_cifrada);
    if (forceDownload) {
      const filename = encodeURIComponent(nombre_original);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
      res.setHeader('Content-Type', 'application/octet-stream');
      return res.send(decrypted);
    }
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(decrypted);
  } catch (err) {
    console.error('Error desencriptando documento:', err);
    res.status(500).json({ error: 'Error al desencriptar el documento' });
  }
});

/**
 * Busca por nombre entre todos los documentos recibidos (sin desencriptar; solo metadatos).
 */
router.get("/documentos/buscar", async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.json([]);
  }

  try {
    const result = await pool.query(
      `SELECT id, nombre_original, fecha_recepcion
       FROM documentos
       WHERE nombre_original ILIKE $1
       ORDER BY fecha_recepcion DESC`,
      [`%${q}%`]
    );

    res.json(result.rows.map((r) => ({
      id: r.id,
      nombreOriginal: r.nombre_original,
      fechaRecepcion: r.fecha_recepcion,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

module.exports = router;
