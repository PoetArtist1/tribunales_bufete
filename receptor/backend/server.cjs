/**
 * Servidor del receptor.
 * Recibe documentos jurídicos cifrados del emisor, los almacena en PostgreSQL
 * y permite listarlos y desencriptarlo
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { WebSocketServer } = require('ws');
const documentosRouter = require('./routes/documentos.cjs');
const { pool } = require('./db/pool.cjs');
const { setWebSocketServer } = require('./ws.cjs');

require('dotenv').config();

const appApi = express();
const appFront = express();

const PORT_FRONT = process.env.PORT_FRONT || 4000;
const PORT_BACK = process.env.PORT_BACK || 4001;

appApi.use(cors({ origin: true }));
appApi.use(express.json({ limit: '50mb' }));

// Las claves se generan por documento cuando el emisor solicita la clave pública.

// API de documentos (recibir, listar, desencriptar)
appApi.use('/api', documentosRouter);

function createProxy(targetBaseUrl) {
  const target = new URL(targetBaseUrl);
  const client = target.protocol === 'https:' ? https : http;
  return (req, res) => {
    const targetUrl = new URL(req.originalUrl, target);
    const options = {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: req.method,
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: {
        ...req.headers,
        host: target.host,
      },
    };
    const proxyReq = client.request(options, (proxyRes) => {
      res.statusCode = proxyRes.statusCode || 500;
      Object.entries(proxyRes.headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', () => {
      res.status(502).json({ error: 'Error al comunicar con el backend' });
    });

    req.pipe(proxyReq, { end: true });
  };
}

appFront.use('/api', createProxy(`http://localhost:${PORT_BACK}`));
appFront.use(express.static(path.join(__dirname, 'public')));

appFront.get('/', (req, res) => {
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
    const apiServer = http.createServer(appApi);
    const wss = new WebSocketServer({ server: apiServer, path: '/ws' });
    setWebSocketServer(wss);

    wss.on('connection', (socket) => {
      socket.send(JSON.stringify({ event: 'connected' }));
    });

    apiServer.listen(PORT_BACK, () => {
      console.log(`[Receptor] API en http://localhost:${PORT_BACK}`);
      console.log(`[Receptor] WebSocket en ws://localhost:${PORT_BACK}/ws`);
    });
    appFront.listen(PORT_FRONT, () => {
      console.log(`[Receptor] Frontend en http://localhost:${PORT_FRONT}`);
    });
  } catch (err) {
    console.error('[Receptor] No se pudo iniciar:', err);
    process.exit(1);
  }
}

start();
