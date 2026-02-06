/**
 * Servidor del emisor
 * Permite subir archivos, cifrarlos con AES-256 y enviar al receptor
 * tras cifrar la clave AES con la clave pública RSA del receptor
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const envioRouter = require('./routes/envio.cjs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

app.use('/api', envioRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Emisor] Servidor en http://localhost:${PORT}`);
  console.log(
    `[Emisor] Receptor configurado: ${process.env.RECEPTOR_URL || 'http://localhost:4000'}`,
  );
});
