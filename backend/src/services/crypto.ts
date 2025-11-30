import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const CLIENT_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // Use same key as frontend
const IV_LENGTH = 16;

if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    console.warn('Warning: ENCRYPTION_KEY must be 32 characters long. Using default key (UNSAFE for production).');
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export function decryptClientEncryptedKey(encryptedText: string): string {
    try {
        const combined = Buffer.from(encryptedText, 'base64');

        const iv = combined.subarray(0, 12);
        const authTagLength = 16;
        const authTag = combined.subarray(combined.length - authTagLength);
        const encrypted = combined.subarray(12, combined.length - authTagLength);

        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(CLIENT_ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Client-side decryption failed:', error);
        throw new Error('Failed to decrypt client-encrypted API key');
    }
}
