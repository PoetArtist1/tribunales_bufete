/**
 * Generación de claves RSA-2048 por documento (Tribunales).
 * El receptor genera un par de claves por solicitud y guarda ambas en la BD.
 */

const crypto = require('crypto');

const RSA_OPTIONS = {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
};

/**
 * Genera un par de claves RSA-2048 para un documento.
 * @returns {{ publicKeyPem: string, privateKeyPem: string }}
 */
function generatePerFileKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync(
    'rsa',
    RSA_OPTIONS,
  );
  return { publicKeyPem: publicKey, privateKeyPem: privateKey };
}

module.exports = {
  generatePerFileKeyPair,
};
