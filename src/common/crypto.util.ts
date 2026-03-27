import * as CryptoJS from 'crypto-js';
const SECRET = process.env.AES_SECRET || 'gipfel-aes-secret-32-characters!';
export function encrypt(plain: string): string {
  if (!plain) return '';
  return CryptoJS.AES.encrypt(plain, SECRET).toString();
}
export function decrypt(cipher: string): string {
  if (!cipher) return '';
  try { return CryptoJS.AES.decrypt(cipher, SECRET).toString(CryptoJS.enc.Utf8); } catch { return ''; }
}
