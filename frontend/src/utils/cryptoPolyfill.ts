import CryptoJS from 'crypto-js';

// 1. Polyfill global.crypto and global.crypto.getRandomValues for React Native / Hermes
if (typeof global !== 'undefined') {
  if (!global.crypto) {
    (global as any).crypto = {};
  }
  if (typeof (global as any).crypto.getRandomValues !== 'function') {
    (global as any).crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
      if (!array) return array;
      const uint8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < uint8.length; i++) {
        uint8[i] = ((Math.random() * 256) | 0) ^ ((Date.now() >>> (i % 8)) & 0xff);
      }
      return array;
    };
  }
}

// 2. Safe monkey-patch for CryptoJS.lib.WordArray.random
try {
  if (CryptoJS && CryptoJS.lib && CryptoJS.lib.WordArray) {
    const originalRandom = CryptoJS.lib.WordArray.random;
    CryptoJS.lib.WordArray.random = function (nBytes: number) {
      try {
        return originalRandom.call(CryptoJS.lib.WordArray, nBytes);
      } catch (_err) {
        // Fallback for environments lacking native crypto (e.g. React Native Hermes)
        const words: number[] = [];
        for (let i = 0; i < nBytes; i += 4) {
          const w = ((Math.random() * 0x100000000) >>> 0) ^ ((Date.now() + i * 37) & 0xffffffff);
          words.push(w);
        }
        return (CryptoJS.lib.WordArray as any).create(words, nBytes);
      }
    };
  }
} catch (_err) {
  // Ignore configuration error if WordArray is read-only
}
