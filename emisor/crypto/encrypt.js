/**
 * cifrado híbrido en el emisor:
 * - AES-256-GCM para el archivo
 * - RSA-2048 (clave pública del receptor) para cifrar la clave AES
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;   // AES-256
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * cifra el contenido del archivo con AES-256-GCM y cifra la clave AES con la clave pública RSA del receptor
 * @param {Buffer} fileContent 
 * @param {string} publicKeyPem - clave pública RSA del receptor (PEM)
 * @returns {{ encryptedContent: Buffer, encryptedAesKey: Buffer }}
 */
function encryptFile(fileContent, publicKeyPem) {
  const aesKey = crypto.randomBytes(KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(fileContent),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // IV (16) + ciphertext + authTag (16)
  const encryptedContent = Buffer.concat([iv, encrypted, authTag]);

  // cifrar la clave AES con la clave pública RSA del receptor (RSA-OAEP SHA-256)
  const encryptedAesKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    aesKey
  );

  return { encryptedContent, encryptedAesKey };
}

module.exports = {
  encryptFile,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
};
