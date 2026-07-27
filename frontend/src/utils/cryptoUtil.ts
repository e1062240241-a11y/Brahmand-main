import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import { secureStorage } from './secureStorage';

export const generateKeyPair = async (): Promise<{ publicKey: string, secretKey: string }> => {
  const keyPair = nacl.box.keyPair();
  const publicKey = util.encodeBase64(keyPair.publicKey);
  const secretKey = util.encodeBase64(keyPair.secretKey);

  await secureStorage.setItem('e2ee_secret_key', secretKey);
  await secureStorage.setItem('e2ee_public_key', publicKey);

  return { publicKey, secretKey };
};

export const getKeys = async (): Promise<{ publicKey: string, secretKey: string } | null> => {
  const secretKey = await secureStorage.getItem('e2ee_secret_key');
  const publicKey = await secureStorage.getItem('e2ee_public_key');

  if (secretKey && publicKey) {
    return { publicKey, secretKey };
  }
  return null;
};

export const encryptMessage = async (message: string, recipientPublicKeyBase64: string): Promise<string> => {
  const keys = await getKeys();
  if (!keys) throw new Error("No E2EE keys found");

  const recipientPublicKey = util.decodeBase64(recipientPublicKeyBase64);
  const mySecretKey = util.decodeBase64(keys.secretKey);

  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = util.decodeUTF8(message);

  const encrypted = nacl.box(messageUint8, nonce, recipientPublicKey, mySecretKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return util.encodeBase64(fullMessage);
};

export const decryptMessage = async (encryptedMessageBase64: string, senderPublicKeyBase64: string): Promise<string> => {
  const keys = await getKeys();
  if (!keys) throw new Error("No E2EE keys found");

  try {
    const fullMessage = util.decodeBase64(encryptedMessageBase64);
    if (fullMessage.length < nacl.box.nonceLength) {
      // Might be a legacy plaintext message or not base64 E2EE
      return encryptedMessageBase64;
    }

    const nonce = fullMessage.slice(0, nacl.box.nonceLength);
    const message = fullMessage.slice(nacl.box.nonceLength);

    const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
    const mySecretKey = util.decodeBase64(keys.secretKey);

    const decrypted = nacl.box.open(message, nonce, senderPublicKey, mySecretKey);
    if (!decrypted) {
       // Returning original string if decryption fails (e.g. legacy message that happens to be base64-like)
      return encryptedMessageBase64;
    }

    return util.encodeUTF8(decrypted);
  } catch (e) {
    // Legacy plaintext message or corrupted, return as is
    return encryptedMessageBase64;
  }
};

export const generateSymmetricKey = (): string => {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return util.encodeBase64(key);
};

export const encryptSymmetricKeyForUser = async (symmetricKeyBase64: string, userPublicKeyBase64: string): Promise<string> => {
  const keys = await getKeys();
  if (!keys) throw new Error("No E2EE keys found");

  const recipientPublicKey = util.decodeBase64(userPublicKeyBase64);
  const mySecretKey = util.decodeBase64(keys.secretKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const symmetricKeyBytes = util.decodeBase64(symmetricKeyBase64);
  const encrypted = nacl.box(symmetricKeyBytes, nonce, recipientPublicKey, mySecretKey);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return util.encodeBase64(fullMessage);
};

export const decryptSymmetricKey = async (encryptedSymmetricKeyBase64: string, senderPublicKeyBase64: string): Promise<string> => {
  const keys = await getKeys();
  if (!keys) throw new Error("No E2EE keys found");

  const fullMessage = util.decodeBase64(encryptedSymmetricKeyBase64);
  if (fullMessage.length < nacl.box.nonceLength) {
    throw new Error("Invalid encrypted key");
  }

  const nonce = fullMessage.slice(0, nacl.box.nonceLength);
  const message = fullMessage.slice(nacl.box.nonceLength);

  const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
  const mySecretKey = util.decodeBase64(keys.secretKey);

  const decrypted = nacl.box.open(message, nonce, senderPublicKey, mySecretKey);
  if (!decrypted) {
    throw new Error("Failed to decrypt symmetric key");
  }

  return util.encodeBase64(decrypted);
};

export const encryptGroupMessage = (message: string, symmetricKeyBase64: string): string => {
  const key = util.decodeBase64(symmetricKeyBase64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageUint8 = util.decodeUTF8(message);

  const encrypted = nacl.secretbox(messageUint8, nonce, key);

  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);

  return util.encodeBase64(fullMessage);
};

export const decryptGroupMessage = (encryptedMessageBase64: string, symmetricKeyBase64: string): string => {
  try {
    const fullMessage = util.decodeBase64(encryptedMessageBase64);
    if (fullMessage.length < nacl.secretbox.nonceLength) {
      return encryptedMessageBase64; // Legacy
    }

    const nonce = fullMessage.slice(0, nacl.secretbox.nonceLength);
    const message = fullMessage.slice(nacl.secretbox.nonceLength);
    const key = util.decodeBase64(symmetricKeyBase64);

    const decrypted = nacl.secretbox.open(message, nonce, key);
    if (!decrypted) {
      return encryptedMessageBase64;
    }

    return util.encodeUTF8(decrypted);
  } catch (e) {
    return encryptedMessageBase64;
  }
};
