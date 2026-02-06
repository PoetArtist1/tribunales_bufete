/**
 * Desencriptación de archivos con RSA-OAEP (SHA-256) por bloques.
 * La clave privada del archivo llega cifrada con la RSA pública del receptor.
 */

const crypto = require('crypto');

const OAEP_HASH = 'sha256';

function getKeySizeBytes(keyObject) {
  const details = keyObject.asymmetricKeyDetails;
  if (!details || !details.modulusLength) {
    throw new Error('No se pudo determinar el tamaño de la clave RSA');
  }
  return Math.ceil(details.modulusLength / 8);
}

function rsaDecryptBuffer(buffer, privateKeyPem) {
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const keySizeBytes = getKeySizeBytes(privateKey);
  if (buffer.length % keySizeBytes !== 0) {
    throw new Error('Tamaño de buffer inválido para RSA por bloques');
  }

  const chunks = [];
  for (let offset = 0; offset < buffer.length; offset += keySizeBytes) {
    const chunk = buffer.subarray(offset, offset + keySizeBytes);
    const decryptedChunk = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: OAEP_HASH,
      },
      chunk,
    );
    chunks.push(decryptedChunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Desencripta el contenido de un documento almacenado con la clave privada del archivo.
 * @param {Buffer} encryptedContent
 * @param {string} filePrivateKeyPem
 * @returns {Buffer}
 */
function decryptFile(encryptedContent, filePrivateKeyPem) {
  return rsaDecryptBuffer(encryptedContent, filePrivateKeyPem);
}

/**
 * Desencripta la clave privada del archivo usando la clave privada del receptor.
 * @param {Buffer} encryptedPrivateKey
 * @param {string} receptorPrivateKeyPem
 * @returns {string}
 */
function decryptFilePrivateKey(encryptedPrivateKey, receptorPrivateKeyPem) {
  return rsaDecryptBuffer(encryptedPrivateKey, receptorPrivateKeyPem).toString(
    'utf8',
  );
}

module.exports = {
  decryptFile,
  decryptFilePrivateKey,
};
