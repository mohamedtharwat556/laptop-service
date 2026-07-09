/**
 * YAS Laptop Service Center - Security Manager
 * Handles password encryption, login attempts, and security features
 */

class SecurityManager {
    constructor() {
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
        this.loginAttempts = {};
        this.init();
    }

    init() {
        this.loadLoginAttempts();
        this.cleanupExpiredLockouts();
    }

    /**
     * Simple hash function for password encryption (demo purposes)
     * In production, use bcrypt or Argon2
     */
    hashPassword(password) {
        // Simple hash for demonstration - NOT SECURE for production
        let hash = 0;
        const salt = 'YAS_SALT_2024';
        const combined = password + salt;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        
        // Convert to hex string
        return Math.abs(hash).toString(16) + this.simpleHash(combined);
    }

    /**
     * Additional simple hash
     */
    simpleHash(str) {
        let hash = '';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash += char.toString(16).padStart(4, '0');
        }
        return hash.substring(0, 32);
    }

    /**
     * Verify password against hash
     */
    verifyPassword(password, hash) {
        const computedHash = this.hashPassword(password);
        return computedHash === hash;
    }

    /**
     * Encrypt sensitive data (base64 encoding for demo)
     * In production, use AES encryption
     */
    encrypt(data) {
        try {
            const encoded = btoa(encodeURIComponent(data));
            return encoded;
        } catch (error) {
            console.error('Encryption error:', error);
            return data;
        }
    }

    /**
     * Decrypt sensitive data
     */
    decrypt(encoded) {
        try {
            const decoded = decodeURIComponent(atob(encoded));
            return decoded;
        } catch (error) {
            console.error('Decryption error:', error);
            return encoded;
        }
    }

    /**
     * Generate secure random token
     */
    generateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Load login attempts from storage
     */
    loadLoginAttempts() {
        this.loginAttempts = storage.get('loginAttempts') || {};
    }

    /**
     * Save login attempts to storage
     */
    saveLoginAttempts() {
        storage.set('loginAttempts', this.loginAttempts);
    }

    /**
     * Record login attempt
     */
    recordLoginAttempt(username, success) {
        const key = username.toLowerCase();
        
        if (!this.loginAttempts[key]) {
            this.loginAttempts[key] = {
                attempts: 0,
                lastAttempt: null,
                lockedUntil: null
            };
        }

        if (success) {
            // Reset on successful login
            this.loginAttempts[key] = {
                attempts: 0,
                lastAttempt: new Date().toISOString(),
                lockedUntil: null
            };
        } else {
            this.loginAttempts[key].attempts++;
            this.loginAttempts[key].lastAttempt = new Date().toISOString();
            
            // Lock account if max attempts reached
            if (this.loginAttempts[key].attempts >= this.maxLoginAttempts) {
                this.loginAttempts[key].lockedUntil = new Date(Date.now() + this.lockoutDuration).toISOString();
            }
        }

        this.saveLoginAttempts();
        return this.loginAttempts[key];
    }

    /**
     * Check if account is locked
     */
    isAccountLocked(username) {
        const key = username.toLowerCase();
        const attempts = this.loginAttempts[key];
        
        if (!attempts || !attempts.lockedUntil) {
            return false;
        }

        const lockedUntil = new Date(attempts.lockedUntil);
        if (lockedUntil > new Date()) {
            return true;
        }

        // Lockout expired, reset
        this.loginAttempts[key] = {
            attempts: 0,
            lastAttempt: null,
            lockedUntil: null
        };
        this.saveLoginAttempts();
        return false;
    }

    /**
     * Get remaining lockout time
     */
    getLockoutTimeRemaining(username) {
        const key = username.toLowerCase();
        const attempts = this.loginAttempts[key];
        
        if (!attempts || !attempts.lockedUntil) {
            return 0;
        }

        const lockedUntil = new Date(attempts.lockedUntil);
        const remaining = lockedUntil - new Date();
        
        return Math.max(0, remaining);
    }

    /**
     * Get remaining attempts
     */
    getRemainingAttempts(username) {
        const key = username.toLowerCase();
        const attempts = this.loginAttempts[key];
        
        if (!attempts) {
            return this.maxLoginAttempts;
        }

        return Math.max(0, this.maxLoginAttempts - attempts.attempts);
    }

    /**
     * Cleanup expired lockouts
     */
    cleanupExpiredLockouts() {
        const now = new Date();
        let cleaned = false;

        for (const key in this.loginAttempts) {
            const attempts = this.loginAttempts[key];
            if (attempts.lockedUntil) {
                const lockedUntil = new Date(attempts.lockedUntil);
                if (lockedUntil <= now) {
                    delete this.loginAttempts[key];
                    cleaned = true;
                }
            }
        }

        if (cleaned) {
            this.saveLoginAttempts();
        }
    }

    /**
     * Validate password strength
     */
    validatePasswordStrength(password) {
        const result = {
            score: 0,
            feedback: [],
            isValid: false
        };

        // Length check
        if (password.length >= 8) {
            result.score += 1;
        } else {
            result.feedback.push('Password must be at least 8 characters');
        }

        // Uppercase check
        if (/[A-Z]/.test(password)) {
            result.score += 1;
        } else {
            result.feedback.push('Add uppercase letters');
        }

        // Lowercase check
        if (/[a-z]/.test(password)) {
            result.score += 1;
        } else {
            result.feedback.push('Add lowercase letters');
        }

        // Number check
        if (/[0-9]/.test(password)) {
            result.score += 1;
        } else {
            result.feedback.push('Add numbers');
        }

        // Special character check
        if (/[^A-Za-z0-9]/.test(password)) {
            result.score += 1;
        } else {
            result.feedback.push('Add special characters');
        }

        result.isValid = result.score >= 4;
        return result;
    }

    /**
     * Sanitize input to prevent XSS
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') {
            return input;
        }

        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Validate email format
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Validate phone format
     */
    validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]{10,}$/;
        return re.test(phone);
    }

    /**
     * Generate CSRF token
     */
    generateCSRFToken() {
        const token = this.generateToken();
        sessionStorage.setItem('YAS_csrf_token', token);
        return token;
    }

    /**
     * Verify CSRF token
     */
    verifyCSRFToken(token) {
        const storedToken = sessionStorage.getItem('YAS_csrf_token');
        return storedToken === token;
    }

    /**
     * Rate limiter for API calls
     */
    rateLimiter(maxRequests, windowMs) {
        const requests = new Map();

        return (identifier) => {
            const now = Date.now();
            const windowStart = now - windowMs;
            
            // Clean old requests
            for (const [id, timestamps] of requests.entries()) {
                requests.set(id, timestamps.filter(t => t > windowStart));
                if (requests.get(id).length === 0) {
                    requests.delete(id);
                }
            }

            // Get current requests for identifier
            const timestamps = requests.get(identifier) || [];
            
            if (timestamps.length >= maxRequests) {
                return false; // Rate limited
            }

            timestamps.push(now);
            requests.set(identifier, timestamps);
            return true; // Allowed
        };
    }

    /**
     * Create rate limiter instance
     */
    createRateLimiter(maxRequests = 10, windowMs = 60000) {
        return this.rateLimiter(maxRequests, windowMs);
    }

    /**
     * Security headers (for server-side implementation)
     */
    getSecurityHeaders() {
        return {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        };
    }

    /**
     * Audit log entry
     */
    logAudit(action, details, userId = null) {
        const auditLog = storage.get('auditLog') || [];
        
        const entry = {
            id: storage.generateId(),
            action,
            details,
            userId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'client-side' // Would be real IP on server
        };

        auditLog.push(entry);
        
        // Keep only last 1000 entries
        if (auditLog.length > 1000) {
            auditLog.shift();
        }

        storage.set('auditLog', auditLog);
        return entry;
    }

    /**
     * Get audit log
     */
    getAuditLog(filters = {}) {
        let auditLog = storage.get('auditLog') || [];

        if (filters.action) {
            auditLog = auditLog.filter(entry => entry.action === filters.action);
        }

        if (filters.userId) {
            auditLog = auditLog.filter(entry => entry.userId === filters.userId);
        }

        if (filters.startDate) {
            auditLog = auditLog.filter(entry => new Date(entry.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            auditLog = auditLog.filter(entry => new Date(entry.timestamp) <= new Date(filters.endDate));
        }

        return auditLog.reverse(); // Most recent first
    }

    /**
     * Secure login with rate limiting and attempt tracking
     */
    secureLogin(username, password) {
        // Check if account is locked
        if (this.isAccountLocked(username)) {
            const remaining = this.getLockoutTimeRemaining(username);
            const minutes = Math.ceil(remaining / 60000);
            return {
                success: false,
                message: `Account locked. Try again in ${minutes} minutes.`,
                locked: true
            };
        }

        // Check remaining attempts
        const remainingAttempts = this.getRemainingAttempts(username);
        if (remainingAttempts <= 0) {
            return {
                success: false,
                message: 'Too many failed attempts. Account locked.',
                locked: true
            };
        }

        // Attempt login
        const user = storage.getUserByUsername(username);
        
        if (user && this.verifyPassword(password, user.password)) {
            // Successful login
            this.recordLoginAttempt(username, true);
            this.logAudit('LOGIN_SUCCESS', { username }, user.id);
            
            return {
                success: true,
                user,
                message: 'Login successful'
            };
        } else {
            // Failed login
            this.recordLoginAttempt(username, false);
            this.logAudit('LOGIN_FAILED', { username });
            
            const attemptsRemaining = this.getRemainingAttempts(username);
            
            return {
                success: false,
                message: `Invalid credentials. ${attemptsRemaining} attempts remaining.`,
                attemptsRemaining
            };
        }
    }

    /**
     * Update user password with hashing
     */
    updatePassword(userId, newPassword) {
        const strength = this.validatePasswordStrength(newPassword);
        
        if (!strength.isValid) {
            return {
                success: false,
                message: 'Password does not meet strength requirements',
                feedback: strength.feedback
            };
        }

        const hashedPassword = this.hashPassword(newPassword);
        storage.updateUser(userId, { password: hashedPassword });
        
        this.logAudit('PASSWORD_CHANGE', { userId });
        
        return {
            success: true,
            message: 'Password updated successfully'
        };
    }

    /**
     * Initialize all users with hashed passwords (migration)
     */
    migratePasswords() {
        const users = storage.getUsers();
        let migrated = 0;

        users.forEach(user => {
            // Check if password is already hashed (simple check)
            if (!user.password.startsWith('hash_')) {
                const hashedPassword = this.hashPassword(user.password);
                storage.updateUser(user.id, { password: hashedPassword });
                migrated++;
            }
        });

        if (migrated > 0) {
            this.logAudit('PASSWORD_MIGRATION', { count: migrated });
        }

        return migrated;
    }
}

// Create global instance
const securityManager = new SecurityManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    securityManager.init();
    
    // Migrate passwords on first load
    securityManager.migratePasswords();
});
