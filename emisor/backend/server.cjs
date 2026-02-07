/**
 * Servidor del emisor
 * Permite subir archivos, cifrarlos con AES-256 y enviar al receptor
 * tras cifrar la clave AES con la clave pública RSA del receptor
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const https = require('https');
const envioRouter = require('./routes/envio.cjs');

require('dotenv').config();

const appApi = express();
const appFront = express();

const PORT_FRONT = process.env.PORT_FRONT || 3000;
const PORT_BACK = process.env.PORT_BACK || 3001;

appApi.use(cors({ origin: true }));
appApi.use(express.json({ limit: '50mb' }));
appApi.use('/api', envioRouter);

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

appApi.listen(PORT_BACK, () => {
  console.log(`[Emisor] API en http://localhost:${PORT_BACK}`);
  console.log(
    `[Emisor] Receptor configurado: ${process.env.RECEPTOR_URL || 'http://localhost:4001'}`,
  );
});

appFront.listen(PORT_FRONT, () => {
  console.log(`[Emisor] Frontend en http://localhost:${PORT_FRONT}`);
});
