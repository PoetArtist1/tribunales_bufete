/**
 * obtener clave pública del receptor y enviar documento cifrado.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { encryptFile } = require('../crypto/encrypt');

const RECEPTOR_URL = process.env.RECEPTOR_URL || 'http://localhost:4000';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

/**
 * Obtiene la clave pública RSA del receptor (para usarla al cifrar)
 */
router.get('/clave-publica-receptor', async (req, res) => {
  try {
    const response = await fetch(`${RECEPTOR_URL}/api/public-key`);
    if (!response.ok) throw new Error('No se pudo obtener la clave pública');
    const pem = await response.text();
    res.type('application/x-pem-file').send(pem);
  } catch (err) {
    console.error('Error obteniendo clave pública del receptor:', err);
    res.status(502).json({
      error: 'No se pudo conectar con el receptor para obtener la clave pública',
    });
  }
});

/**
 * Recibe un archivo por multipart, lo cifra con AES-256 y cifra la clave AES con la RSA del receptor,
 * luego envía al receptor (POST /api/documentos)
 */
router.post('/enviar', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Falta el archivo en el envío' });
  }
  const nombreOriginal = req.body.nombreOriginal || req.file.originalname || 'documento';
  try {
    const publicKeyRes = await fetch(`${RECEPTOR_URL}/api/public-key`);
    if (!publicKeyRes.ok) throw new Error('No se pudo obtener la clave pública del receptor');
    const publicKeyPem = await publicKeyRes.text();
    const { encryptedContent, encryptedAesKey } = encryptFile(req.file.buffer, publicKeyPem);
    const body = {
      nombreOriginal,
      archivoCifradoB64: encryptedContent.toString('base64'),
      claveAesCifradaB64: encryptedAesKey.toString('base64'),
    };
    const sendRes = await fetch(`${RECEPTOR_URL}/api/documentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!sendRes.ok) {
      const errText = await sendRes.text();
      throw new Error(errText || 'Error al enviar al receptor');
    }
    const result = await sendRes.json();
    res.status(201).json({
      mensaje: 'Documento enviado y almacenado cifrado en el receptor',
      id: result.id,
      nombreOriginal: result.nombreOriginal,
      fechaRecepcion: result.fechaRecepcion,
    });
  } catch (err) {
    console.error('Error en envío:', err);
    res.status(500).json({
      error: err.message || 'Error al cifrar o enviar el documento',
    });
  }
});

module.exports = router;
