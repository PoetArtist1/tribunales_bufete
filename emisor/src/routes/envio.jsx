import express from 'express';
import { pool } from '../db/pool.cjs';
import crypto from 'crypto';
import { generatePerFileKeyPair } from '../crypto/keys.cjs';

const router = express.Router();

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
  } catch (error) {
    console.error('Error al generar la clave pública:', error);
    res.status(500).json({ error: 'Error al generar la clave pública.' });
  }
});

// Agregar más rutas según sea necesario

export default router;
