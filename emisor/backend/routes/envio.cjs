/**
 * obtener clave pública del receptor y enviar documento cifrado.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const crypto = require('crypto');
const { encryptFile, encryptPrivateKey } = require('../crypto/encrypt.cjs');

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
    const data = await response.json();
    if (!data?.publicKeyPem || !data?.id) {
      throw new Error('Respuesta inválida de clave pública');
    }
    res.json({ id: data.id, publicKeyPem: data.publicKeyPem });
  } catch (err) {
    console.error('Error obteniendo clave pública del receptor:', err);
    res.status(502).json({
      error:
        'No se pudo conectar con el receptor para obtener la clave pública',
    });
  }
});

/**
 * Recibe un archivo por multipart, lo cifra con RSA-OAEP (por bloques) y cifra la clave privada
 * del archivo con la RSA pública del receptor, luego envía al receptor (POST /api/documentos)
 */
router.post('/enviar', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Falta el archivo en el envío' });
  }
  const normalizeUtf8 = (value) => {
    if (!value) return value;
    return Buffer.from(value, 'latin1').toString('utf8');
  };
  const nombreOriginal =
    normalizeUtf8(req.body.nombreOriginal) ||
    normalizeUtf8(req.file.originalname) ||
    'documento';
  try {
    console.log('Obteniendo clave pública del receptor...');
    const publicKeyRes = await fetch(`${RECEPTOR_URL}/api/public-key`);
    if (!publicKeyRes.ok)
      throw new Error('No se pudo obtener la clave pública del receptor');
    const publicKeyPayload = await publicKeyRes.json();
    console.log('Clave pública del receptor obtenida:', publicKeyPayload);
    const publicKeyPem = publicKeyPayload?.publicKeyPem;
    const documentoId = publicKeyPayload?.id;
    console.log('ID de documento recibido:', documentoId);

    if (!publicKeyPem || !documentoId) {
      throw new Error('Respuesta inválida del receptor (id/clave pública)');
    }

    const { encryptedContent, privateKeyPem } = encryptFile(req.file.buffer);
    const encryptedPrivateKey = encryptPrivateKey(privateKeyPem, publicKeyPem);
    console.log('Documento cifrado, enviando al receptor...');
    const hashSha256 = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('hex');
    const body = {
      id: documentoId,
      nombreOriginal,
      archivoCifradoB64: encryptedContent.toString('base64'),
      clavePrivadaCifradaB64: encryptedPrivateKey.toString('base64'),
      hashSha256,
    };
    console.log('Cuerpo preparado para envío:', {
      id: body.id,
      nombreOriginal: body.nombreOriginal,
      archivoCifradoB64Length: body.archivoCifradoB64.length,
      clavePrivadaCifradaB64Length: body.clavePrivadaCifradaB64.length,
      hashSha256: body.hashSha256,
    });
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
    console.log('Documento enviado y almacenado en el receptor:', result);
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
