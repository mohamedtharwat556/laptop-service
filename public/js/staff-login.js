// Staff credentials (in production, this should be validated on the server)
const STAFF_CREDENTIALS = {
    'محمود': {
        password: 'محمود123',
        name: 'محمود'
    },
    'شروق': {
        password: 'شروق123',
        name: 'شروق'
    }
};

class StaffLoginManager {
    constructor() {
        this.init();
    }

    init() {
        const form = document.getElementById('staffLoginForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Check if already logged in
        this.checkExistingSession();
    }

    checkExistingSession() {
        const loggedInStaff = localStorage.getItem('loggedInStaff');
        if (loggedInStaff) {
            const staff = JSON.parse(loggedInStaff);
            this.redirectToRequestPage(staff.name);
        }
    }

    handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const username = form.querySelector('[name="username"]').value.trim();
        const password = form.querySelector('[name="password"]').value;

        const errorDiv = document.getElementById('loginError');
        const errorMessage = document.getElementById('errorMessage');

        // Validate credentials
        if (STAFF_CREDENTIALS[username] && STAFF_CREDENTIALS[username].password === password) {
            // Successful login
            const staffInfo = {
                name: STAFF_CREDENTIALS[username].name,
                username: username,
                loginTime: new Date().toISOString()
            };

            // Store in localStorage
            localStorage.setItem('loggedInStaff', JSON.stringify(staffInfo));

            // Hide error
            errorDiv.style.display = 'none';

            // Redirect to request page
            this.redirectToRequestPage(staffInfo.name);
        } else {
            // Failed login
            errorDiv.style.display = 'block';
            errorMessage.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    }

    redirectToRequestPage(staffName) {
        // Get the redirect target from URL parameter or default to customer.html
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || 'customer.html';

        // Add staff name as parameter
        const redirectUrl = `${redirect}?staff=${encodeURIComponent(staffName)}`;
        window.location.href = redirectUrl;
    }
}

// Initialize
const staffLoginManager = new StaffLoginManager();

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('passwordInput');
    const eyeIcon = document.getElementById('eyeIcon');

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
