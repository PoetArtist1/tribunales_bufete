/**
 * Desencriptación de archivos con AES-256-GCM.
 * La clave AES se obtiene desencriptando clave_aes_cifrada con la RSA privada del receptor.
 */

const crypto = require('crypto');
const { decryptAesKey } = require('./keys');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Desencripta el contenido de un documento almacenado.
 * @param {Buffer} encryptedContent - Archivo cifrado (IV + ciphertext + authTag concatenados)
 * @param {Buffer} encryptedAesKey - Clave AES cifrada con RSA pública del receptor
 * @returns {Buffer} - Contenido del archivo en claro
 */
function decryptFile(encryptedContent, encryptedAesKey) {
  const aesKey = decryptAesKey(encryptedAesKey);
  const iv = encryptedContent.subarray(0, IV_LENGTH);
  const authTag = encryptedContent.subarray(encryptedContent.length - AUTH_TAG_LENGTH);
  const ciphertext = encryptedContent.subarray(IV_LENGTH, encryptedContent.length - AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

module.exports = {
  decryptFile,
  IV_LENGTH,
  AUTH_TAG_LENGTH,
};
