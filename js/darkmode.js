// Dark Mode Toggle Functionality
(function() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle?.querySelector('i');
    
    // Check for saved preference or system preference
    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    
    // Apply theme
    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            if (icon) {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
            localStorage.setItem('theme', 'dark');
        }
    }
    
    // Initialize theme
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);
    
    // Toggle theme on button click
    if (toggle) {
        toggle.addEventListener('click', () => {
            const currentTheme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
            
            // Add animation
            toggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                toggle.style.transform = 'rotate(0deg)';
            }, 300);
        });
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
    
    // Expose theme functions globally for other scripts
    window.themeManager = {
        setTheme: applyTheme,
        getTheme: () => document.body.classList.contains('light-mode') ? 'light' : 'dark'
    };
})();
