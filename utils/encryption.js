const crypto = require('crypto');

// Encryption configuration
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const iterations = 100000;

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted data in format: salt:iv:tag:encrypted
 */
function encrypt(text) {
    try {
        if (!text) return null;
        
        const iv = crypto.randomBytes(ivLength);
        const salt = crypto.randomBytes(saltLength);
        
        // Derive key using PBKDF2
        const key = crypto.pbkdf2Sync(secretKey, salt, iterations, 32, 'sha256');
        
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        // Return format: salt:iv:tag:encrypted
        return `${salt.toString('hex')}:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data in format: salt:iv:tag:encrypted
 * @returns {string|null} - Decrypted plain text or null if decryption fails
 */
function decrypt(encryptedData) {
    try {
        if (!encryptedData) return null;
        
        const parts = encryptedData.split(':');
        if (parts.length !== 4) return null;
        
        const salt = Buffer.from(parts[0], 'hex');
        const iv = Buffer.from(parts[1], 'hex');
        const tag = Buffer.from(parts[2], 'hex');
        const encrypted = parts[3];
        
        // Derive key using PBKDF2
        const key = crypto.pbkdf2Sync(secretKey, salt, iterations, 32, 'sha256');
        
        const decipher = crypto.createDecipheriv(algorithm, key, iv);
        decipher.setAuthTag(tag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

/**
 * Hash sensitive data for comparison (one-way)
 * @param {string} text - Plain text to hash
 * @returns {string} - Hashed value
 */
function hash(text) {
    try {
        if (!text) return null;
        
        const salt = crypto.randomBytes(saltLength);
        const hash = crypto.pbkdf2Sync(text, salt, iterations, 64, 'sha512');
        
        return `${salt.toString('hex')}:${hash.toString('hex')}`;
    } catch (error) {
        console.error('Hashing error:', error);
        return null;
    }
}

/**
 * Compare plain text with hashed value
 * @param {string} text - Plain text
 * @param {string} hashedData - Hashed data in format: salt:hash
 * @returns {boolean} - True if match, false otherwise
 */
function compareHash(text, hashedData) {
    try {
        if (!text || !hashedData) return false;
        
        const parts = hashedData.split(':');
        if (parts.length !== 2) return false;
        
        const salt = Buffer.from(parts[0], 'hex');
        const hash = crypto.pbkdf2Sync(text, salt, iterations, 64, 'sha512');
        
        return hash.toString('hex') === parts[1];
    } catch (error) {
        console.error('Hash comparison error:', error);
        return false;
    }
}

/**
 * Generate secure random token
 * @param {number} length - Length of token in bytes
 * @returns {string} - Hex encoded token
 */
function generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

module.exports = {
    encrypt,
    decrypt,
    hash,
    compareHash,
    generateToken
};
