/**
 * YAS Laptop Service Center - Theme Manager
 * Handles multiple color themes for the application
 */

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('YAS_theme') || 'default';
        this.themes = [
            { id: 'default', name: 'Default Blue', color: '#3b82f6' },
            { id: 'purple', name: 'Purple', color: '#a78bfa' },
            { id: 'green', name: 'Green', color: '#10b981' },
            { id: 'red', name: 'Red', color: '#ef4444' },
            { id: 'orange', name: 'Orange', color: '#f97316' },
            { id: 'pink', name: 'Pink', color: '#ec4899' },
            { id: 'teal', name: 'Teal', color: '#14b8a6' },
            { id: 'indigo', name: 'Indigo', color: '#6366f1' }
        ];
        this.init();
    }

    init() {
        this.applyTheme();
        this.createThemeToggle();
    }

    createThemeToggle() {
        const container = document.createElement('div');
        container.className = 'theme-dropdown';
        
        const toggle = document.createElement('button');
        toggle.className = 'theme-toggle';
        toggle.innerHTML = `
            <span class="theme-color-dot" style="background: ${this.getThemeColor()}"></span>
            <i class="fas fa-palette"></i>
        `;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown-content';
        dropdown.innerHTML = this.themes.map(theme => `
            <div class="theme-option ${theme.id === this.currentTheme ? 'active' : ''}" 
                 data-theme="${theme.id}">
                <span class="theme-color-dot" style="background: ${theme.color}"></span>
                <span>${theme.name}</span>
            </div>
        `).join('');
        
        container.appendChild(toggle);
        container.appendChild(dropdown);
        
        // Add click handlers
        dropdown.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.setTheme(option.dataset.theme);
            });
        });
        
        const navbar = document.querySelector('.nav-container');
        if (navbar) {
            navbar.appendChild(container);
        }
    }

    getThemeColor() {
        const theme = this.themes.find(t => t.id === this.currentTheme);
        return theme ? theme.color : '#3b82f6';
    }

    setTheme(themeId) {
        this.currentTheme = themeId;
        localStorage.setItem('YAS_theme', themeId);
        this.applyTheme();
        this.updateToggle();
    }

    applyTheme() {
        // Remove all theme classes
        document.body.classList.remove(
            'theme-purple', 'theme-green', 'theme-red', 'theme-orange',
            'theme-pink', 'theme-teal', 'theme-indigo'
        );
        
        // Add current theme class if not default
        if (this.currentTheme !== 'default') {
            document.body.classList.add(`theme-${this.currentTheme}`);
        }
        
        // Load theme CSS
        this.loadThemeCSS();
    }

    loadThemeCSS() {
        let themeLink = document.getElementById('theme-stylesheet');
        
        if (this.currentTheme !== 'default') {
            if (!themeLink) {
                themeLink = document.createElement('link');
                themeLink.rel = 'stylesheet';
                themeLink.href = 'css/themes.css';
                themeLink.id = 'theme-stylesheet';
                document.head.appendChild(themeLink);
            }
        } else {
            if (themeLink) {
                themeLink.remove();
            }
        }
    }

    updateToggle() {
        const dot = document.querySelector('.theme-toggle .theme-color-dot');
        if (dot) {
            dot.style.background = this.getThemeColor();
        }
        
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === this.currentTheme);
        });
    }
}

// Create global instance
const themeManager = new ThemeManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Theme manager initializes in constructor
});
