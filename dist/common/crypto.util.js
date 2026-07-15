"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const CryptoJS = require("crypto-js");
const SECRET = process.env.AES_SECRET || 'gipfel-aes-secret-32-characters!';
function encrypt(plain) {
    if (!plain)
        return '';
    return CryptoJS.AES.encrypt(plain, SECRET).toString();
}
function decrypt(cipher) {
    if (!cipher)
        return '';
    try {
        return CryptoJS.AES.decrypt(cipher, SECRET).toString(CryptoJS.enc.Utf8);
    }
    catch {
        return '';
    }
}
//# sourceMappingURL=crypto.util.js.map