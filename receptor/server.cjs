/**
 * Servidor del receptor.
 * Recibe documentos jurídicos cifrados del emisor, los almacena en PostgreSQL
 * y permite listarlos y desencriptarlo
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const documentosRouter = require('./routes/documentos.cjs');
const { pool } = require('./db/pool.cjs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Las claves se generan por documento cuando el emisor solicita la clave pública.

// API de documentos (recibir, listar, desencriptar)
app.use('/api', documentosRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// inicializar base de datos (ejecutar schema si existe)
async function initDb() {
  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    try {
      await pool.query(schema);
      console.log('[Receptor] Esquema de base de datos aplicado.');
    } catch (err) {
      console.error('[Receptor] Error aplicando esquema:', err.message);
      throw err;
    }
  }
}

async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`[Receptor] Servidor en http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Receptor] No se pudo iniciar:', err);
    process.exit(1);
  }
}

start();
