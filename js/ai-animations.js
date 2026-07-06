/* ================================================
   YAS Laptop Service — AI Animations Engine
   Particles · Typing · Scroll Reveal · Counters
   ================================================ */

(function () {
    'use strict';

    // ==============================
    // 1. PARTICLES BACKGROUND
    // ==============================
    function initParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        document.body.insertBefore(canvas, document.body.firstChild);
        const ctx = canvas.getContext('2d');

        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        });

        const isLight = () => document.body.classList.contains('light-mode');

        const NUM = 60;
        const particles = Array.from({ length: NUM }, () => ({
            x: Math.random() * W,
            y: Math.random() * H,
            r: Math.random() * 2 + 0.5,
            dx: (Math.random() - 0.5) * 0.4,
            dy: (Math.random() - 0.5) * 0.4,
            alpha: Math.random() * 0.5 + 0.2
        }));

        function drawParticles() {
            ctx.clearRect(0, 0, W, H);
            const color = isLight() ? '26,26,255' : '96,165,250';

            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color},${p.alpha})`;
                ctx.fill();

                p.x += p.dx;
                p.y += p.dy;

                if (p.x < 0 || p.x > W) p.dx *= -1;
                if (p.y < 0 || p.y > H) p.dy *= -1;
            });

            // Draw connecting lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${color},${0.08 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(drawParticles);
        }
        drawParticles();
    }

    // ==============================
    // 2. TYPING EFFECT
    // ==============================
    function initTyping() {
        const el = document.getElementById('typing-text');
        if (!el) return;

        const phrases = [
            'صيانة وإصلاح لابتوب محترف',
            'خدمة سريعة وضمان 90 يوم',
            'فنيون معتمدون ومحترفون',
            'قطع غيار أصلية وعالية الجودة'
        ];

        let phraseIdx = 0;
        let charIdx = 0;
        let deleting = false;
        let delay = 100;

        // Create cursor
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        el.after(cursor);

        function type() {
            const current = phrases[phraseIdx];
            if (deleting) {
                el.textContent = current.substring(0, charIdx - 1);
                charIdx--;
                delay = 50;
            } else {
                el.textContent = current.substring(0, charIdx + 1);
                charIdx++;
                delay = 100;
            }

            if (!deleting && charIdx === current.length) {
                delay = 2000;
                deleting = true;
            } else if (deleting && charIdx === 0) {
                deleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                delay = 400;
            }

            setTimeout(type, delay);
        }
        setTimeout(type, 800);
    }

    // ==============================
    // 3. SCROLL REVEAL
    // ==============================
    function initScrollReveal() {
        const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-stagger';
        const elements = document.querySelectorAll(selectors);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Don't unobserve stagger — keep watching
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        elements.forEach(el => observer.observe(el));
    }

    // ==============================
    // 4. COUNTER ANIMATION
    // ==============================
    function initCounters() {
        const counters = document.querySelectorAll('[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    const suffix = el.dataset.suffix || '';
                    const duration = 1800;
                    const start = performance.now();

                    function update(now) {
                        const progress = Math.min((now - start) / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 3);
                        el.textContent = Math.floor(ease * target) + suffix;
                        if (progress < 1) requestAnimationFrame(update);
                    }
                    requestAnimationFrame(update);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(el => observer.observe(el));
    }

    // ==============================
    // 5. LAPTOP SVG ANIMATION (Hero Visual)
    // ==============================
    function buildLaptopVisual() {
        const container = document.getElementById('hero-laptop');
        if (!container) return;

        container.innerHTML = `
            <div class="laptop-wrapper">
                <svg viewBox="0 0 400 280" width="380" height="280" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="lgBody" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#1e293b"/>
                            <stop offset="100%" style="stop-color:#0f172a"/>
                        </linearGradient>
                        <linearGradient id="lgScreen" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#0d1b3e"/>
                            <stop offset="100%" style="stop-color:#080c1a"/>
                        </linearGradient>
                        <linearGradient id="lgAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#1a1aff"/>
                            <stop offset="100%" style="stop-color:#60a5fa"/>
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur"/>
                            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                        </filter>
                    </defs>

                    <!-- Base / keyboard -->
                    <rect x="40" y="190" width="320" height="18" rx="4" fill="url(#lgBody)"/>
                    <rect x="30" y="204" width="340" height="10" rx="5" fill="#1e2d40"/>

                    <!-- Keyboard area -->
                    <rect x="55" y="170" width="290" height="22" rx="3" fill="#131e2e"/>
                    <!-- Keys rows -->
                    <g fill="#1a2840" opacity="0.8">
                        ${[...Array(12)].map((_, i) => `<rect x="${62 + i * 22}" y="174" width="18" height="7" rx="2"/>`).join('')}
                        ${[...Array(11)].map((_, i) => `<rect x="${65 + i * 22}" y="183" width="18" height="7" rx="2"/>`).join('')}
                    </g>
                    <!-- Touchpad -->
                    <rect x="155" y="196" width="90" height="5" rx="2.5" fill="#1a2840" opacity="0.7"/>

                    <!-- Screen lid -->
                    <rect x="50" y="20" width="300" height="155" rx="8" fill="url(#lgBody)"/>
                    <!-- Screen bezel -->
                    <rect x="58" y="28" width="284" height="140" rx="5" fill="url(#lgScreen)"/>

                    <!-- Screen content - UI mockup -->
                    <!-- Top bar -->
                    <rect x="62" y="32" width="276" height="20" rx="3" fill="#0d1b3e"/>
                    <circle cx="72" cy="42" r="4" fill="#ef4444" opacity="0.8"/>
                    <circle cx="84" cy="42" r="4" fill="#f59e0b" opacity="0.8"/>
                    <circle cx="96" cy="42" r="4" fill="#10b981" opacity="0.8"/>
                    <!-- Logo in screen -->
                    <text x="165" y="46" font-family="Arial" font-size="8" fill="#60a5fa" text-anchor="middle" font-weight="bold">YAS SERVICE</text>

                    <!-- Dashboard cards on screen -->
                    <rect x="66" y="56" width="82" height="42" rx="4" fill="rgba(26,26,255,0.15)" stroke="rgba(96,165,250,0.3)" stroke-width="0.5"/>
                    <text x="107" y="72" font-family="Arial" font-size="6" fill="#60a5fa" text-anchor="middle">طلبات اليوم</text>
                    <text x="107" y="90" font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">24</text>

                    <rect x="155" y="56" width="82" height="42" rx="4" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.3)" stroke-width="0.5"/>
                    <text x="196" y="72" font-family="Arial" font-size="6" fill="#10b981" text-anchor="middle">منجز</text>
                    <text x="196" y="90" font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">18</text>

                    <rect x="244" y="56" width="82" height="42" rx="4" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.3)" stroke-width="0.5"/>
                    <text x="285" y="72" font-family="Arial" font-size="6" fill="#f59e0b" text-anchor="middle">قيد العمل</text>
                    <text x="285" y="90" font-family="Arial" font-size="16" fill="white" text-anchor="middle" font-weight="bold">6</text>

                    <!-- Chart bars -->
                    <g>
                        <rect x="72" y="130" width="12" height="25" rx="2" fill="url(#lgAccent)" opacity="0.8"/>
                        <rect x="88" y="120" width="12" height="35" rx="2" fill="url(#lgAccent)" opacity="0.7"/>
                        <rect x="104" y="115" width="12" height="40" rx="2" fill="url(#lgAccent)" opacity="0.9"/>
                        <rect x="120" y="125" width="12" height="30" rx="2" fill="url(#lgAccent)" opacity="0.6"/>
                        <rect x="136" y="110" width="12" height="45" rx="2" fill="url(#lgAccent)" opacity="0.8"/>
                    </g>

                    <!-- Status list -->
                    <rect x="162" y="107" width="154" height="10" rx="2" fill="rgba(255,255,255,0.05)"/>
                    <rect x="162" y="107" width="110" height="10" rx="2" fill="rgba(16,185,129,0.5)"/>
                    <text x="164" y="115" font-family="Arial" font-size="6" fill="white">صيانة هاردوير 71%</text>

                    <rect x="162" y="121" width="154" height="10" rx="2" fill="rgba(255,255,255,0.05)"/>
                    <rect x="162" y="121" width="80" height="10" rx="2" fill="rgba(96,165,250,0.5)"/>
                    <text x="164" y="129" font-family="Arial" font-size="6" fill="white">برمجيات 52%</text>

                    <rect x="162" y="135" width="154" height="10" rx="2" fill="rgba(255,255,255,0.05)"/>
                    <rect x="162" y="135" width="50" height="10" rx="2" fill="rgba(245,158,11,0.5)"/>
                    <text x="164" y="143" font-family="Arial" font-size="6" fill="white">ترقيات 32%</text>

                    <!-- Animated scan line -->
                    <line x1="62" y1="60" x2="334" y2="60" stroke="rgba(26,26,255,0.3)" stroke-width="1">
                        <animateTransform attributeName="transform" type="translate" from="0,0" to="0,100" dur="3s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite"/>
                    </line>

                    <!-- YAS logo glow on lid -->
                    <circle cx="200" cy="10" r="6" fill="url(#lgAccent)" opacity="0.9" filter="url(#glow)">
                        <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <div class="laptop-glow-ring"></div>
            </div>`;
    }

    // ==============================
    // 6. LIGHT MODE TOGGLE ENHANCE
    // ==============================
    function enhanceLightModeToggle() {
        // Redundant click handler removed to prevent conflict with ThemeManager in app.js
    }

    // ==============================
    // 7. NAVBAR SCROLL EFFECT
    // ==============================
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.padding = '0.4rem 2rem';
                navbar.style.boxShadow = '0 8px 40px rgba(0,0,0,0.5)';
            } else {
                navbar.style.padding = '0.6rem 2rem';
                navbar.style.boxShadow = '0 4px 30px rgba(0,0,0,0.4)';
            }
        }, { passive: true });
    }

    // ==============================
    // INIT ALL
    // ==============================
    document.addEventListener('DOMContentLoaded', () => {
        initParticles();
        initTyping();
        buildLaptopVisual();
        initScrollReveal();
        initCounters();
        enhanceLightModeToggle();
        initNavbarScroll();
    });

})();
