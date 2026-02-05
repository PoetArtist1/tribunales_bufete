/**
 * Gestión del par de claves RSA-2048 del receptor (Tribunales).
 * El receptor genera y guarda su clave privada; expone la pública al emisor.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

const RSA_OPTIONS = {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
};

/**
 * Asegura que exista el directorio de claves.
 */
function ensureKeysDir() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }
}

/**
 * Genera un nuevo par de claves RSA-2048 y lo guarda en disco.
 * Solo se ejecuta si no existen las claves (por ejemplo, al iniciar por primera vez).
 */
function generateKeyPair() {
  ensureKeysDir();
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', RSA_OPTIONS);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, 'utf8');
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, 'utf8');
  console.log('[Receptor] Par de claves RSA-2048 generado en', KEYS_DIR);
}

/**
 * Carga la clave pública del receptor (para que el emisor la use al cifrar).
 */
function getPublicKeyPem() {
  if (!fs.existsSync(PUBLIC_KEY_PATH)) {
    generateKeyPair();
  }
  return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
}

/**
 * Carga la clave privada del receptor (solo para desencriptar en este servidor).
 */
function getPrivateKeyPem() {
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    generateKeyPair();
  }
  return fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
}

/**
 * Desencripta un buffer que fue cifrado con la clave pública RSA del receptor.
 * Se usa para recuperar la clave AES que cifró el archivo.
 * @param {Buffer} encryptedBuffer - Clave AES cifrada (con RSA pública)
 * @returns {Buffer} - Clave AES en claro (32 bytes para AES-256)
 */
function decryptAesKey(encryptedBuffer) {
  const privateKey = getPrivateKeyPem();
  return crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    encryptedBuffer
  );
}

module.exports = {
  generateKeyPair,
  getPublicKeyPem,
  getPrivateKeyPem,
  decryptAesKey,
  PUBLIC_KEY_PATH,
  PRIVATE_KEY_PATH,
};
