// Hikvision admin credentials (in production, this should be validated on the server)
const HIKVISION_CREDENTIALS = {
    'فاروق': {
        password: 'فاروق123',
        name: 'فاروق'
    }
};

class HikvisionLoginManager {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById('hikvisionLoginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Check if already logged in
        this.checkExistingSession();
    }

    checkExistingSession() {
        const loggedInHikvision = localStorage.getItem('loggedInHikvision');
        if (loggedInHikvision) {
            const hikvision = JSON.parse(loggedInHikvision);
            this.redirectToRequestPage(hikvision.name);
        }
    }

    handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const username = form.querySelector('[name="username"]').value.trim();
        const password = form.querySelector('[name="password"]').value;

        const errorDiv = document.getElementById('hikvisionLoginError');
        const errorMessage = document.getElementById('hikvisionErrorMessage');

        // Validate credentials
        if (HIKVISION_CREDENTIALS[username] && HIKVISION_CREDENTIALS[username].password === password) {
            // Successful login
            const hikvisionInfo = {
                name: HIKVISION_CREDENTIALS[username].name,
                username: username,
                loginTime: new Date().toISOString()
            };

            // Store in localStorage
            localStorage.setItem('loggedInHikvision', JSON.stringify(hikvisionInfo));

            // Hide error
            errorDiv.style.display = 'none';

            // Redirect to request page
            this.redirectToRequestPage(hikvisionInfo.name);
        } else {
            // Failed login
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    }

    redirectToRequestPage(hikvisionName) {
        // Redirect to Hikvision request page
        window.location.href = 'hikvision-customer.html';
    }
}

// Toggle password visibility
function toggleHikvisionPassword() {
    const passwordInput = document.getElementById('hikvisionPassword');
    const eyeIcon = document.getElementById('hikvisionEyeIcon');

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
const hikvisionLoginManager = new HikvisionLoginManager();
