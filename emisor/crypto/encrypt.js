/**
 * cifrado asimétrico en el emisor (por archivo):
 * - RSA-2048 para cifrar el archivo (por bloques)
 * - RSA-2048 del receptor para cifrar la llave privada del documento
 */

const crypto = require('crypto');

const RSA_OPTIONS = {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
};

function getKeySizeBytes(keyObject) {
  const details = keyObject.asymmetricKeyDetails;
  if (details?.modulusLength) return Math.ceil(details.modulusLength / 8);
  return 256; // 2048 bits por defecto
}

function getMaxMessageSize(publicKeyObject) {
  const keyBytes = getKeySizeBytes(publicKeyObject);
  const hashLen = 32; // SHA-256
  return keyBytes - 2 * hashLen - 2;
}

/**
 * Encripta un buffer grande con RSA-OAEP-SHA256 por bloques.
 * @param {Buffer} buffer
 * @param {string} publicKeyPem
 * @returns {Buffer}
 */
function rsaEncryptBuffer(buffer, publicKeyPem) {
  const publicKeyObject = crypto.createPublicKey(publicKeyPem);
  const maxChunk = getMaxMessageSize(publicKeyObject);
  const chunks = [];
  for (let offset = 0; offset < buffer.length; offset += maxChunk) {
    const chunk = buffer.subarray(offset, offset + maxChunk);
    const encryptedChunk = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      chunk,
    );
    chunks.push(encryptedChunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Genera un par de claves RSA para el documento.
 * @returns {{ publicKeyPem: string, privateKeyPem: string }}
 */
function generateDocumentKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync(
    'rsa',
    RSA_OPTIONS,
  );
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

/**
 * Cifra el archivo con RSA-2048 por bloques usando la clave pública del documento.
 * @param {Buffer} fileContent
 * @returns {{ encryptedContent: Buffer, privateKeyPem: string, publicKeyPem: string }}
 */
function encryptFile(fileContent) {
  const { publicKeyPem, privateKeyPem } = generateDocumentKeyPair();
  const encryptedContent = rsaEncryptBuffer(fileContent, publicKeyPem);
  return {
    encryptedContent,
    privateKeyPem,
    publicKeyPem,
  };
}

/**
 * Cifra la llave privada del documento con la clave pública del receptor.
 * @param {string} privateKeyPem
 * @param {string} receptorPublicKeyPem
 * @returns {Buffer}
 */
function encryptPrivateKey(privateKeyPem, receptorPublicKeyPem) {
  return rsaEncryptBuffer(
    Buffer.from(privateKeyPem, 'utf8'),
    receptorPublicKeyPem,
  );
}

module.exports = {
  encryptFile,
  rsaEncryptBuffer,
  generateDocumentKeyPair,
  encryptPrivateKey,
};
