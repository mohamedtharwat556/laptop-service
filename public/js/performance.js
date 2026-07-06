/**
 * YAS Laptop Service Center - Performance Manager
 * Handles performance optimizations and page loading improvements
 */

class PerformanceManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCodeSplitting();
        this.setupDebounceThrottle();
        this.setupVirtualScrolling();
        this.monitorPerformance();
    }

    /**
     * Setup lazy loading for images
     */
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            observer.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    /**
     * Setup image optimization
     */
    setupImageOptimization() {
        // Add loading="lazy" to all images
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }

    /**
     * Setup code splitting hints
     */
    setupCodeSplitting() {
        // Add preload hints for critical resources
        const criticalResources = [
            '/css/style.css',
            '/js/storage.js',
            '/js/app.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    /**
     * Setup debounce and throttle utilities
     */
    setupDebounceThrottle() {
        // These are already in Utils, but we can enhance them
        window.debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        window.throttle = (func, limit) => {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };
    }

    /**
     * Setup virtual scrolling for large lists
     */
    setupVirtualScrolling() {
        // For tables and lists with many items
        const largeLists = document.querySelectorAll('.table-container, .products-grid');
        
        largeLists.forEach(container => {
            if (container.scrollHeight > 1000) {
                container.style.maxHeight = '600px';
                container.style.overflowY = 'auto';
                container.style.position = 'relative';
            }
        });
    }

    /**
     * Monitor performance metrics
     */
    monitorPerformance() {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Monitor First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.log('FID:', entry.processingStart - entry.startTime);
                }
            });
            fidObserver.observe({ entryTypes: ['first-input'] });

            // Monitor Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                console.log('CLS:', clsValue);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }

        // Log page load time
        window.addEventListener('load', () => {
            const perfData = performance.timing;
            const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
            const connectTime = perfData.responseEnd - perfData.requestStart;
            const renderTime = perfData.domComplete - perfData.domLoading;
            const domContentLoadedTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

            console.log('Performance Metrics:', {
                pageLoadTime,
                connectTime,
                renderTime,
                domContentLoadedTime
            });
        });
    }

    /**
     * Optimize DOM operations
     */
    optimizeDOM() {
        // Batch DOM reads
        const batchReads = (elements, property) => {
            return elements.map(el => el[property]);
        };

        // Batch DOM writes
        const batchWrites = (elements, property, value) => {
            elements.forEach(el => {
                el[property] = value;
            });
        };

        return { batchReads, batchWrites };
    }

    /**
     * Optimize event listeners
     */
    optimizeEventListeners() {
        // Use event delegation for dynamic elements
        document.addEventListener('click', (e) => {
            // Handle delegated clicks
            if (e.target.matches('.btn-delete')) {
                // Handle delete button clicks
            }
            if (e.target.matches('.btn-edit')) {
                // Handle edit button clicks
            }
        });
    }

    /**
     * Setup requestAnimationFrame for animations
     */
    setupAnimations() {
        window.requestAnimFrame = (function() {
            return window.requestAnimationFrame ||
                   window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame ||
                   function(callback) {
                       window.setTimeout(callback, 1000 / 60);
                   };
        })();
    }

    /**
     * Optimize localStorage operations
     */
    optimizeLocalStorage() {
        // Batch localStorage reads
        const batchGet = (keys) => {
            const data = {};
            keys.forEach(key => {
                data[key] = localStorage.getItem(key);
            });
            return data;
        };

        // Batch localStorage writes
        const batchSet = (data) => {
            Object.entries(data).forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
        };

        return { batchGet, batchSet };
    }

    /**
     * Setup service worker for caching
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
    }

    /**
     * Preload critical resources
     */
    preloadResources(resources) {
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.url;
            link.as = resource.type;
            if (resource.crossorigin) {
                link.crossOrigin = resource.crossorigin;
            }
            document.head.appendChild(link);
        });
    }

    /**
     * Setup prefetch for likely next pages
     */
    setupPrefetch() {
        const likelyNextPages = [
            '/customer.html',
            '/shop.html',
            '/track.html'
        ];

        likelyNextPages.forEach(page => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = page;
            document.head.appendChild(link);
        });
    }

    /**
     * Optimize CSS delivery
     */
    optimizeCSS() {
        // Inline critical CSS (would be done in build process)
        const criticalCSS = `
            /* Critical CSS would be inlined here */
        `;

        // Load non-critical CSS asynchronously
        const loadCSS = (href) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.media = 'print';
            link.onload = () => {
                link.media = 'all';
            };
            document.head.appendChild(link);
        };

        return { loadCSS };
    }

    /**
     * Setup memory management
     */
    setupMemoryManagement() {
        // Clear unused data periodically
        setInterval(() => {
            // Clear old cache entries
            if (window.caches) {
                caches.keys().then(cacheNames => {
                    cacheNames.forEach(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            caches.delete(cacheName);
                        }
                    });
                });
            }
        }, 300000); // Every 5 minutes
    }

    /**
     * Get performance score
     */
    getPerformanceScore() {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        // Simple scoring based on load time
        if (pageLoadTime < 1000) return 100;
        if (pageLoadTime < 2000) return 80;
        if (pageLoadTime < 3000) return 60;
        if (pageLoadTime < 5000) return 40;
        return 20;
    }

    /**
     * Generate performance report
     */
    generateReport() {
        const perfData = performance.timing;
        const navigation = performance.navigation;

        return {
            // Navigation timing
            pageLoadTime: perfData.loadEventEnd - perfData.navigationStart,
            domReadyTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
            connectTime: perfData.responseEnd - perfData.requestStart,
            renderTime: perfData.domComplete - perfData.domLoading,
            
            // Navigation type
            navigationType: navigation.type,
            redirectCount: navigation.redirectCount,
            
            // Memory info (if available)
            memory: performance.memory ? {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            } : null,
            
            // Score
            score: this.getPerformanceScore()
        };
    }

    /**
     * Apply all optimizations
     */
    applyOptimizations() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCodeSplitting();
        this.setupDebounceThrottle();
        this.setupVirtualScrolling();
        this.setupAnimations();
        this.setupServiceWorker();
        this.setupPrefetch();
        this.setupMemoryManagement();
        this.optimizeEventListeners();
    }
}

// Create global instance
const performanceManager = new PerformanceManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    performanceManager.applyOptimizations();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceManager;
}
