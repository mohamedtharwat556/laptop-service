const crypto = require('crypto');
const { encrypt, decrypt, generateToken } = require('./encryption');

// In-memory storage for OTP codes (in production, use Redis or database)
const otpStore = new Map();

// OTP expiration time (5 minutes)
const OTP_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate a 6-digit OTP code
 * @returns {string} - 6-digit OTP code
 */
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate TOTP secret for user
 * @returns {object} - Secret and QR code data
 */
function generateTOTPSecret() {
    const secret = crypto.randomBytes(32).toString('base32');
    const encryptedSecret = encrypt(secret);
    
    return {
        secret: encryptedSecret,
        // In production, you would generate a QR code URL here
        // for apps like Google Authenticator
        qrCodeUrl: `otpauth://totp/YAS-Laptop-Service?secret=${secret}`
    };
}

/**
 * Verify TOTP code
 * @param {string} encryptedSecret - Encrypted secret
 * @param {string} token - TOTP token from authenticator app
 * @returns {boolean} - True if valid
 */
function verifyTOTP(encryptedSecret, token) {
    try {
        const secret = decrypt(encryptedSecret);
        if (!secret) return false;

        // In production, use a proper TOTP library like 'otplib'
        // This is a simplified version
        const timeStep = Math.floor(Date.now() / 30000); // 30-second windows
        
        // Generate valid tokens for current and adjacent time windows
        const validTokens = [];
        for (let i = -1; i <= 1; i++) {
            const time = timeStep + i;
            const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base32'));
            hmac.update(Buffer.from(time.toString()));
            const digest = hmac.digest();
            const offset = digest[digest.length - 1] & 0x0f;
            const code = ((digest[offset] & 0x7f) << 24 |
                         (digest[offset + 1] & 0xff) << 16 |
                         (digest[offset + 2] & 0xff) << 8 |
                         (digest[offset + 3] & 0xff)) % 1000000;
            validTokens.push(code.toString().padStart(6, '0'));
        }

        return validTokens.includes(token);
    } catch (error) {
        console.error('TOTP verification error:', error);
        return false;
    }
}

/**
 * Send OTP via SMS (placeholder - integrate with SMS service)
 * @param {string} phoneNumber - Phone number
 * @param {string} otp - OTP code
 * @returns {boolean} - True if sent successfully
 */
async function sendOTPSMS(phoneNumber, otp) {
    try {
        console.log(`Sending OTP ${otp} to ${phoneNumber}`);
        
        // In production, integrate with SMS service like:
        // - Twilio
        // - AWS SNS
        // - Nexmo
        // - Local SMS gateway
        
        // Placeholder implementation
        return true;
    } catch (error) {
        console.error('Error sending OTP SMS:', error);
        return false;
    }
}

/**
 * Send OTP via Email (placeholder - integrate with email service)
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 * @returns {boolean} - True if sent successfully
 */
async function sendOTPEmail(email, otp) {
    try {
        console.log(`Sending OTP ${otp} to ${email}`);
        
        // In production, integrate with email service like:
        // - SendGrid
        // - AWS SES
        // - Mailgun
        // - Nodemailer
        
        // Placeholder implementation
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        return false;
    }
}

/**
 * Generate and store OTP for a user
 * @param {string} userId - User ID
 * @param {string} method - Delivery method ('sms' or 'email')
 * @param {string} destination - Phone number or email
 * @returns {object} - Result with success status
 */
async function generateAndStoreOTP(userId, method, destination) {
    try {
        const otp = generateOTP();
        const otpId = generateToken();
        
        // Store OTP with expiration
        otpStore.set(otpId, {
            userId,
            otp,
            method,
            destination,
            createdAt: Date.now(),
            expiresAt: Date.now() + OTP_EXPIRY_MS,
            attempts: 0
        });
        
        // Send OTP based on method
        let sent = false;
        if (method === 'sms') {
            sent = await sendOTPSMS(destination, otp);
        } else if (method === 'email') {
            sent = await sendOTPEmail(destination, otp);
        }
        
        if (!sent) {
            otpStore.delete(otpId);
            return { success: false, error: 'Failed to send OTP' };
        }
        
        return { success: true, otpId };
    } catch (error) {
        console.error('Error generating OTP:', error);
        return { success: false, error };
    }
}

/**
 * Verify OTP code
 * @param {string} otpId - OTP ID
 * @param {string} code - OTP code to verify
 * @returns {object} - Verification result
 */
function verifyOTP(otpId, code) {
    try {
        const otpData = otpStore.get(otpId);
        
        if (!otpData) {
            return { success: false, error: 'Invalid OTP ID' };
        }
        
        // Check expiration
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(otpId);
            return { success: false, error: 'OTP expired' };
        }
        
        // Check attempts (max 3 attempts)
        if (otpData.attempts >= 3) {
            otpStore.delete(otpId);
            return { success: false, error: 'Too many attempts' };
        }
        
        // Verify code
        if (otpData.otp !== code) {
            otpData.attempts++;
            return { success: false, error: 'Invalid OTP', attemptsRemaining: 3 - otpData.attempts };
        }
        
        // OTP verified successfully
        otpStore.delete(otpId);
        
        return { 
            success: true, 
            userId: otpData.userId,
            method: otpData.method 
        };
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return { success: false, error };
    }
}

/**
 * Enable 2FA for a user
 * @param {string} userId - User ID
 * @param {string} method - 2FA method ('totp', 'sms', or 'email')
 * @param {string} secret - TOTP secret (for TOTP method)
 * @returns {object} - Result
 */
function enable2FA(userId, method, secret = null) {
    try {
        const twoFactorData = {
            enabled: true,
            method,
            secret: secret || null,
            enabledAt: new Date().toISOString()
        };
        
        // In production, save to database
        // await db.users.update(userId, { twoFactorData });
        
        console.log(`2FA enabled for user ${userId} using ${method}`);
        
        return { success: true, twoFactorData };
    } catch (error) {
        console.error('Error enabling 2FA:', error);
        return { success: false, error };
    }
}

/**
 * Disable 2FA for a user
 * @param {string} userId - User ID
 * @returns {object} - Result
 */
function disable2FA(userId) {
    try {
        // In production, update database
        // await db.users.update(userId, { twoFactorData: null });
        
        console.log(`2FA disabled for user ${userId}`);
        
        return { success: true };
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        return { success: false, error };
    }
}

/**
 * Check if 2FA is enabled for a user
 * @param {string} userId - User ID
 * @returns {boolean} - True if enabled
 */
function is2FAEnabled(userId) {
    try {
        // In production, check database
        // const user = await db.users.getById(userId);
        // return user.twoFactorData?.enabled || false;
        
        return false; // Placeholder
    } catch (error) {
        console.error('Error checking 2FA status:', error);
        return false;
    }
}

/**
 * Clean up expired OTPs
 */
function cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [otpId, otpData] of otpStore.entries()) {
        if (now > otpData.expiresAt) {
            otpStore.delete(otpId);
        }
    }
}

// Run cleanup every minute
setInterval(cleanupExpiredOTPs, 60000);

module.exports = {
    generateOTP,
    generateTOTPSecret,
    verifyTOTP,
    sendOTPSMS,
    sendOTPEmail,
    generateAndStoreOTP,
    verifyOTP,
    enable2FA,
    disable2FA,
    is2FAEnabled,
    cleanupExpiredOTPs
};
