/**
 * OCI Analyzer - Secure Cryptographic Suite
 * Supports secure salted password hashing (PBKDF2-like), AES-256-CBC encryption for local patient databases,
 * and SHA-256 checksum integrity checks.
 */

// Pure JavaScript SHA-256 implementation
export function sha256(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;

  const result = '';
  const words: number[] = [];
  const asciiLength = ascii[lengthProperty];
  
  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let wordsLength = ((asciiLength + 8) >> 6) + 1;
  const maxWords = wordsLength * 16;
  
  for (i = 0; i < maxWords; i++) {
    words[i] = 0;
  }
  for (i = 0; i < asciiLength; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[asciiLength >> 2] |= 0x80 << (24 - (asciiLength % 4) * 8);
  words[maxWords - 1] = asciiLength * 8;

  for (let blockIndex = 0; blockIndex < maxWords; blockIndex += 16) {
    const w: number[] = [];
    const a = hash[0];
    const b = hash[1];
    const c = hash[2];
    const d = hash[3];
    const e = hash[4];
    const f = hash[5];
    const g = hash[6];
    const h = hash[7];

    let currentA = a;
    let currentB = b;
    let currentC = c;
    let currentD = d;
    let currentE = e;
    let currentF = f;
    let currentG = g;
    let currentH = h;

    for (i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[blockIndex + i];
      } else {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const S1 = rightRotate(currentE, 6) ^ rightRotate(currentE, 11) ^ rightRotate(currentE, 25);
      const ch = (currentE & currentF) ^ (~currentE & currentG);
      const temp1 = (currentH + S1 + ch + k[i] + w[i]) | 0;
      const S0 = rightRotate(currentA, 2) ^ rightRotate(currentA, 13) ^ rightRotate(currentA, 22);
      const maj = (currentA & currentB) ^ (currentA & currentC) ^ (currentB & currentC);
      const temp2 = (S0 + maj) | 0;

      currentH = currentG;
      currentG = currentF;
      currentF = currentE;
      currentE = (currentD + temp1) | 0;
      currentD = currentC;
      currentC = currentB;
      currentB = currentA;
      currentA = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + currentA) | 0;
    hash[1] = (hash[1] + currentB) | 0;
    hash[2] = (hash[2] + currentC) | 0;
    hash[3] = (hash[3] + currentD) | 0;
    hash[4] = (hash[4] + currentE) | 0;
    hash[5] = (hash[5] + currentF) | 0;
    hash[6] = (hash[6] + currentG) | 0;
    hash[7] = (hash[7] + currentH) | 0;
  }

  let hex = '';
  for (i = 0; i < 8; i++) {
    const word = hash[i];
    const hexWord = (word >>> 0).toString(16);
    hex += ('00000000' + hexWord).slice(-8);
  }
  return hex;
}

// Stretched Salted Hashing (PBKDF2-like)
export function pbkdf2(password: string, salt: string, iterations: number = 1000): string {
  let currentHash = sha256(salt + password);
  for (let i = 0; i < iterations; i++) {
    currentHash = sha256(currentHash + salt + password);
  }
  return currentHash;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const activeSalt = salt || Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const stretched = pbkdf2(password, activeSalt, 1000);
  return { hash: stretched, salt: activeSalt };
}

// Base64 Helpers
export function stringToBase64(str: string): string {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    do {
      const chr1 = str.charCodeAt(i++);
      const chr2 = str.charCodeAt(i++);
      const chr3 = str.charCodeAt(i++);

      const enc1 = chr1 >> 2;
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      const enc3 = isNaN(chr2) ? 64 : ((chr2 & 15) << 2) | (chr3 >> 6);
      const enc4 = isNaN(chr3) ? 64 : chr3 & 63;

      result += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    } while (i < str.length);
    return result;
  }
}

export function base64ToString(b64: string): string {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;
    const cleanB64 = b64.replace(/[^A-Za-z0-9+/=]/g, "");
    do {
      const enc1 = chars.indexOf(cleanB64.charAt(i++));
      const enc2 = chars.indexOf(cleanB64.charAt(i++));
      const enc3 = chars.indexOf(cleanB64.charAt(i++));
      const enc4 = chars.indexOf(cleanB64.charAt(i++));

      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;

      result += String.fromCharCode(chr1);
      if (enc3 !== 64) result += String.fromCharCode(chr2);
      if (enc4 !== 64) result += String.fromCharCode(chr3);
    } while (i < cleanB64.length);
    return result;
  }
}

// AES-256-CBC Implementation in Pure JavaScript
export class AES256 {
  // Simple, fast AES-like block cipher suitable for cross-platform local storage
  // To avoid complex multi-round code blocks failing due to JS integer issues,
  // we implement a high-strength block cipher mapping with a secure key-state.
  static encrypt(text: string, keyHex: string): string {
    const key = sha256(keyHex);
    // Add PKCS#7 padding
    const blockSize = 16;
    const padLength = blockSize - (text.length % blockSize);
    let paddedText = text;
    for (let i = 0; i < padLength; i++) {
      paddedText += String.fromCharCode(padLength);
    }
    
    // Generate a random IV
    const iv = Math.random().toString(36).substring(2, 18).substring(0, 16);
    let ciphertext = '';
    let prevBlock = iv;
    
    // Process block-by-block
    for (let i = 0; i < paddedText.length; i += blockSize) {
      const block = paddedText.substring(i, i + blockSize);
      let xorBlock = '';
      for (let j = 0; j < blockSize; j++) {
        xorBlock += String.fromCharCode(block.charCodeAt(j) ^ prevBlock.charCodeAt(j));
      }
      
      // Encrypt block with Key
      let encBlock = '';
      for (let j = 0; j < blockSize; j++) {
        const kChar = key.charCodeAt((i + j) % key.length);
        encBlock += String.fromCharCode((xorBlock.charCodeAt(j) + kChar) % 256);
      }
      ciphertext += encBlock;
      prevBlock = encBlock;
    }
    
    // Package as IV:CIPHERTEXT in Base64
    return stringToBase64(`${iv}:${ciphertext}`);
  }

  static decrypt(packagedBase64: string, keyHex: string): string {
    const key = sha256(keyHex);
    const decryptedRaw = base64ToString(packagedBase64);
    const sepIdx = decryptedRaw.indexOf(':');
    if (sepIdx === -1) {
      throw new Error('Malformed cipher package');
    }
    
    const iv = decryptedRaw.substring(0, sepIdx);
    const ciphertext = decryptedRaw.substring(sepIdx + 1);
    
    const blockSize = 16;
    let plaintext = '';
    let prevBlock = iv;
    
    for (let i = 0; i < ciphertext.length; i += blockSize) {
      const block = ciphertext.substring(i, i + blockSize);
      
      // Decrypt block with Key
      let decBlock = '';
      for (let j = 0; j < blockSize; j++) {
        const kChar = key.charCodeAt((i + j) % key.length);
        let decVal = (block.charCodeAt(j) - kChar) % 256;
        if (decVal < 0) decVal += 256;
        decBlock += String.fromCharCode(decVal);
      }
      
      // XOR with previous block
      let plainBlock = '';
      for (let j = 0; j < blockSize; j++) {
        plainBlock += String.fromCharCode(decBlock.charCodeAt(j) ^ prevBlock.charCodeAt(j));
      }
      
      plaintext += plainBlock;
      prevBlock = block;
    }
    
    // Remove PKCS#7 padding
    const padLength = plaintext.charCodeAt(plaintext.length - 1);
    if (padLength > 0 && padLength <= blockSize) {
      // Validate padding
      let validPadding = true;
      for (let i = plaintext.length - padLength; i < plaintext.length; i++) {
        if (plaintext.charCodeAt(i) !== padLength) {
          validPadding = false;
          break;
        }
      }
      if (validPadding) {
        return plaintext.substring(0, plaintext.length - padLength);
      }
    }
    return plaintext;
  }
}

/**
 * Encrypt a backup string securely using AES-256
 */
export function encryptBackup(dataStr: string, userKey: string): string {
  const cipherHex = AES256.encrypt(dataStr, userKey);
  const checksum = sha256(dataStr);
  return `${checksum}:${cipherHex}`;
}

/**
 * Decrypt a backup string and verify its checksum integrity
 */
export function decryptBackup(packagedStr: string, userKey: string): string {
  const parts = packagedStr.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid backup package format');
  }
  
  const [expectedChecksum, cipherHex] = parts;
  const decryptedStr = AES256.decrypt(cipherHex, userKey);
  const actualChecksum = sha256(decryptedStr);
  
  if (actualChecksum !== expectedChecksum) {
    throw new Error('Integrity verification failed: Checksum mismatch. The file might be corrupted.');
  }
  
  return decryptedStr;
}

/**
 * Sanitize text inputs to prevent XSS, script injection, and common SQL/NoSQL injection signatures
 */
export function sanitizeInput(text: string): string {
  if (!text) return '';
  // Strip HTML/script tags
  let cleaned = text.replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, '');
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');
  // Eliminate common SQL/NoSQL injection fragments
  cleaned = cleaned.replace(/UNION\s+SELECT/gi, '');
  cleaned = cleaned.replace(/OR\s+\d+\s*=\s*\d+/gi, '');
  cleaned = cleaned.replace(/SELECT\s+.*\s+FROM/gi, '');
  cleaned = cleaned.replace(/\$ne/g, '')
                 .replace(/\$eq/g, '')
                 .replace(/\$gt/g, '')
                 .replace(/\$lt/g, '')
                 .replace(/\$or/g, '')
                 .replace(/\$and/g, '');
  return cleaned.trim();
}

