/**
 * YAS Laptop Service Center - Products Module
 * Handles product display on homepage
 */

class ProductsManager {
    constructor() {
        this.products = [];
    }

    /**
     * Initialize products manager
     */
    async init() {
        this.loadProducts();
        this.renderProducts();
    }

    /**
     * Load products from storage
     */
    loadProducts() {
        this.products = storage.getProducts();
    }

    /**
     * Render products on homepage
     */
    renderProducts() {
        const container = document.getElementById('productsGrid');
        if (!container) return;

        // Only show featured products
        const featuredProducts = this.products.filter(product => product.featured);

        if (featuredProducts.length === 0) {
            container.innerHTML = `
                <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <i class="fas fa-box" style="font-size: 3rem;color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--white); margin-bottom: 0.5rem;">لا توجد منتجات معروضة حالياً</h3>
                    <p style="color: var(--text-muted);">سيتم إضافة المنتجات قريباً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = featuredProducts.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/1e3a8a/ffffff?text=No+Image'">
                <span class="product-category">${product.category}</span>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">${Utils.formatCurrency(product.price)}</p>
                <p class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${product.stock > 0 ? `متوفر (${product.stock} قطعة)` : 'نفدت الكمية'}
                </p>
                <div class="product-actions">
                    <a href="https://wa.me/201013791517?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن المنتج: ${product.name}`)}" 
                       class="btn btn-primary" target="_blank">
                        <i class="fab fa-whatsapp"></i> اطلب الآن
                    </a>
                </div>
            </div>
        `).join('');
    }
}

// Initialize products manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (typeof storage !== 'undefined') {
        const productsManager = new ProductsManager();
        productsManager.init();
    }
});
