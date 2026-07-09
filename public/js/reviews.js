/**
 * YAS Laptop Service Center - Reviews Manager
 * Handles product reviews and ratings system
 */

class ReviewsManager {
    constructor() {
        this.reviews = [];
        this.init();
    }

    init() {
        this.loadReviews();
    }

    loadReviews() {
        this.reviews = storage.get('reviews') || [];
    }

    saveReviews() {
        storage.set('reviews', this.reviews);
    }

    getReviewsByProduct(productId) {
        return this.reviews.filter(review => review.productId === productId);
    }

    getAverageRating(productId) {
        const productReviews = this.getReviewsByProduct(productId);
        if (productReviews.length === 0) return 0;
        
        const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
        return (sum / productReviews.length).toFixed(1);
    }

    addReview(reviewData) {
        const newReview = {
            id: storage.generateId(),
            ...reviewData,
            createdAt: new Date().toISOString(),
            helpful: 0
        };
        
        this.reviews.push(newReview);
        this.saveReviews();
        return newReview;
    }

    updateReview(reviewId, data) {
        const index = this.reviews.findIndex(r => r.id === reviewId);
        if (index !== -1) {
            this.reviews[index] = { ...this.reviews[index], ...data };
            this.saveReviews();
            return this.reviews[index];
        }
        return null;
    }

    deleteReview(reviewId) {
        this.reviews = this.reviews.filter(r => r.id !== reviewId);
        this.saveReviews();
    }

    markHelpful(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (review) {
            review.helpful++;
            this.saveReviews();
        }
    }

    renderStars(rating, interactive = false, reviewId = null) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (interactive) {
                stars += `<i class="fas fa-star ${i <= rating ? 'text-warning' : 'text-muted'}" 
                           style="cursor: pointer; color: ${i <= rating ? '#f59e0b' : '#64748b'}"
                           onclick="reviewsManager.setRating(${reviewId}, ${i})"></i>`;
            } else {
                stars += `<i class="fas fa-star" style="color: ${i <= rating ? '#f59e0b' : '#64748b'}"></i>`;
            }
        }
        return stars;
    }

    renderProductReviews(productId) {
        const reviews = this.getReviewsByProduct(productId);
        const averageRating = this.getAverageRating(productId);
        
        return `
            <div class="reviews-section" style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem;">Customer Reviews</h3>
                
                <div class="rating-summary glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                    <div style="display: flex; align-items: center; gap: 2rem;">
                        <div style="text-align: center;">
                            <div style="font-size: 3rem; font-weight: 700; color: #f59e0b;">${averageRating}</div>
                            <div style="color: var(--text-muted-more);">out of 5</div>
                        </div>
                        <div style="flex: 1;">
                            ${this.renderRatingDistribution(reviews)}
                        </div>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="reviewsManager.showAddReviewModal(${productId})" style="margin-bottom: 1.5rem;">
                    <i class="fas fa-plus"></i> Write a Review
                </button>
                
                <div class="reviews-list">
                    ${reviews.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-star"></i>
                            <h3>No Reviews Yet</h3>
                            <p>Be the first to review this product!</p>
                        </div>
                    ` : reviews.map(review => this.renderReviewCard(review)).join('')}
                </div>
            </div>
        `;
    }

    renderRatingDistribution(reviews) {
        const distribution = [0, 0, 0, 0, 0];
        reviews.forEach(review => {
            distribution[review.rating - 1]++;
        });
        
        const total = reviews.length;
        
        return `
            ${[5, 4, 3, 2, 1].map((star, index) => {
                const count = distribution[4 - index];
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return `
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <span style="width: 60px;">${star} star</span>
                        <div style="flex: 1; background: var(--card-bg-subtle); border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${percentage}%; background: #f59e0b; height: 100%;"></div>
                        </div>
                        <span style="width: 40px; text-align: right; color: var(--text-muted-more);">${count}</span>
                    </div>
                `;
            }).join('')}
        `;
    }

    renderReviewCard(review) {
        return `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                        <div style="margin-bottom: 0.5rem;">
                            ${this.renderStars(review.rating)}
                        </div>
                        <h4 style="font-weight: 600;">${review.author}</h4>
                    </div>
                    <span style="color: var(--text-muted-more); font-size: 0.875rem;">${Utils.formatDate(review.createdAt)}</span>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 1rem;">${review.comment}</p>
                ${review.verifiedPurchase ? `
                    <span style="display: inline-flex; align-items: center; gap: 0.25rem; color: #10b981; font-size: 0.875rem;">
                        <i class="fas fa-check-circle"></i> Verified Purchase
                    </span>
                ` : ''}
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                            onclick="reviewsManager.markHelpful('${review.id}')">
                        <i class="fas fa-thumbs-up"></i> Helpful (${review.helpful})
                    </button>
                </div>
            </div>
        `;
    }

    showAddReviewModal(productId) {
        const content = `
            <form id="addReviewForm">
                <div class="form-group">
                    <label class="form-label">Your Name *</label>
                    <input type="text" class="form-input" name="author" required placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label class="form-label">Rating *</label>
                    <div id="ratingStars" style="font-size: 1.5rem; display: flex; gap: 0.5rem;">
                        ${[1, 2, 3, 4, 5].map(i => `
                            <i class="fas fa-star" style="cursor: pointer; color: #64748b;" 
                               data-rating="${i}" onclick="reviewsManager.selectRating(${i})"></i>
                        `).join('')}
                    </div>
                    <input type="hidden" name="rating" id="selectedRating" value="0">
                </div>
                <div class="form-group">
                    <label class="form-label">Your Review *</label>
                    <textarea class="form-textarea" name="comment" rows="4" required 
                              placeholder="Share your experience with this product..."></textarea>
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="verifiedPurchase" id="verifiedPurchase">
                        <span>I purchased this product</span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-paper-plane"></i> Submit Review
                </button>
            </form>
        `;

        modalManager.create('add-review', 'Write a Review', content);
        modalManager.open('add-review');

        const form = document.getElementById('addReviewForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const rating = parseInt(document.getElementById('selectedRating').value);
            if (rating === 0) {
                toast.error('Please select a rating');
                return;
            }

            const reviewData = {
                productId: productId,
                author: form.author.value,
                rating: rating,
                comment: form.comment.value,
                verifiedPurchase: form.verifiedPurchase.checked
            };

            this.addReview(reviewData);
            modalManager.close('add-review');
            toast.success('Review submitted successfully!');
            
            // Refresh reviews if on product page
            const reviewsSection = document.querySelector('.reviews-section');
            if (reviewsSection) {
                reviewsSection.innerHTML = this.renderProductReviews(productId);
            }
        });
    }

    selectRating(rating) {
        document.getElementById('selectedRating').value = rating;
        const stars = document.querySelectorAll('#ratingStars i');
        stars.forEach((star, index) => {
            star.style.color = index < rating ? '#f59e0b' : '#64748b';
        });
    }
}

// Create global instance
const reviewsManager = new ReviewsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    reviewsManager.init();
});
