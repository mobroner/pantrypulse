// Pure JS password hashing for Cloudflare Workers
// Uses PBKDF2 from @noble/hashes for compatibility
import { pbkdf2, pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

const SALT_LENGTH = 16;
const ITERATIONS = 100_000;
const KEY_LENGTH = 32;

function getRandomSalt() {
  const salt = new Uint8Array(SALT_LENGTH);
  crypto.getRandomValues(salt);
  return salt;
}

function toHex(uint8arr) {
  return Array.from(uint8arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

export async function hashPassword(password) {
  const salt = getRandomSalt();
  const hash = await pbkdf2Async(sha256, password, salt, { c: ITERATIONS, dkLen: KEY_LENGTH });
  return `${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, hashHex] = stored.split('$');
  const salt = fromHex(saltHex);
  const hash = fromHex(hashHex);
  const testHash = await pbkdf2Async(sha256, password, salt, { c: ITERATIONS, dkLen: KEY_LENGTH });
  if (testHash.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= testHash[i] ^ hash[i];
  return diff === 0;
}
