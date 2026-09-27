/**
 * YAS Laptop Service Center - Hikvision Admin Login Module
 * Handles Hikvision admin authentication
 */

class HikvisionAdminLoginManager {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        const form = document.getElementById('hikvisionAdminLoginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.login();
        });
    }

    async login() {
        const form = document.getElementById('hikvisionAdminLoginForm');
        const username = form.querySelector('[name="username"]').value;
        const password = form.querySelector('[name="password"]').value;
        const errorDiv = document.getElementById('hikvisionAdminLoginError');
        const errorMessage = document.getElementById('hikvisionAdminErrorMessage');

        // Simple client-side validation (for demo purposes)
        if (username === 'hikvision' && password === 'hikvision123') {
            // Store login in localStorage
            localStorage.setItem('loggedInHikvisionAdmin', JSON.stringify({
                username: username,
                name: 'Hikvision Admin'
            }));

            // Redirect to Hikvision admin dashboard
            window.location.href = 'hikvision-admin.html';
        } else {
            // Show error
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    }
}

// Toggle password visibility
function toggleHikvisionAdminPassword() {
    const passwordInput = document.getElementById('hikvisionAdminPassword');
    const eyeIcon = document.getElementById('hikvisionAdminEyeIcon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Initialize
const hikvisionAdminLoginManager = new HikvisionAdminLoginManager();
