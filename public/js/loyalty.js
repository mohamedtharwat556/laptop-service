/**
 * YAS Laptop Service Center - Loyalty Points Manager
 * Handles customer loyalty points system
 */

class LoyaltyManager {
    constructor() {
        this.pointsPerDollar = 1;
        this.pointsPerRequest = 50;
        this.pointsPerReview = 25;
        this.redemptionRate = 100; // 100 points = $1 discount
        this.init();
    }

    init() {
        this.loadCustomerPoints();
    }

    /**
     * Load customer points from storage
     */
    loadCustomerPoints() {
        this.customerPoints = storage.get('customerPoints') || {};
    }

    /**
     * Save customer points to storage
     */
    saveCustomerPoints() {
        storage.set('customerPoints', this.customerPoints);
    }

    /**
     * Get customer points by phone number
     */
    getCustomerPoints(phone) {
        return this.customerPoints[phone] || {
            phone: phone,
            points: 0,
            tier: 'Bronze',
            totalEarned: 0,
            totalRedeemed: 0,
            history: []
        };
    }

    /**
     * Add points to customer account
     */
    addPoints(phone, points, reason, metadata = {}) {
        const customerData = this.getCustomerPoints(phone);
        
        customerData.points += points;
        customerData.totalEarned += points;
        customerData.history.unshift({
            type: 'earned',
            points: points,
            reason: reason,
            metadata: metadata,
            timestamp: new Date().toISOString()
        });

        // Update tier
        customerData.tier = this.calculateTier(customerData.totalEarned);

        this.customerPoints[phone] = customerData;
        this.saveCustomerPoints();

        return customerData;
    }

    /**
     * Redeem points from customer account
     */
    redeemPoints(phone, points, reason, metadata = {}) {
        const customerData = this.getCustomerPoints(phone);

        if (customerData.points < points) {
            return {
                success: false,
                message: 'Insufficient points'
            };
        }

        customerData.points -= points;
        customerData.totalRedeemed += points;
        customerData.history.unshift({
            type: 'redeemed',
            points: -points,
            reason: reason,
            metadata: metadata,
            timestamp: new Date().toISOString()
        });

        this.customerPoints[phone] = customerData;
        this.saveCustomerPoints();

        return {
            success: true,
            customerData,
            discountValue: points / this.redemptionRate
        };
    }

    /**
     * Calculate customer tier based on total earned points
     */
    calculateTier(totalPoints) {
        if (totalPoints >= 10000) return 'Platinum';
        if (totalPoints >= 5000) return 'Gold';
        if (totalPoints >= 2500) return 'Silver';
        return 'Bronze';
    }

    /**
     * Get tier benefits
     */
    getTierBenefits(tier) {
        const benefits = {
            Bronze: {
                pointsMultiplier: 1,
                discountPercentage: 0,
                prioritySupport: false,
                exclusiveOffers: false
            },
            Silver: {
                pointsMultiplier: 1.25,
                discountPercentage: 5,
                prioritySupport: false,
                exclusiveOffers: true
            },
            Gold: {
                pointsMultiplier: 1.5,
                discountPercentage: 10,
                prioritySupport: true,
                exclusiveOffers: true
            },
            Platinum: {
                pointsMultiplier: 2,
                discountPercentage: 15,
                prioritySupport: true,
                exclusiveOffers: true
            }
        };

        return benefits[tier] || benefits.Bronze;
    }

    /**
     * Award points for order
     */
    awardOrderPoints(order) {
        const points = Math.floor(order.total * this.pointsPerDollar);
        const customerData = this.addPoints(
            order.customerPhone,
            points,
            'Order Purchase',
            { orderId: order.orderNumber, orderTotal: order.total }
        );

        return customerData;
    }

    /**
     * Award points for service request
     */
    awardRequestPoints(request) {
        const customerData = this.addPoints(
            request.phone,
            this.pointsPerRequest,
            'Service Request',
            { requestNumber: request.requestNumber }
        );

        return customerData;
    }

    /**
     * Award points for review
     */
    awardReviewPoints(phone, productId) {
        const customerData = this.addPoints(
            phone,
            this.pointsPerReview,
            'Product Review',
            { productId: productId }
        );

        return customerData;
    }

    /**
     * Calculate discount from points
     */
    calculateDiscount(phone, pointsToRedeem) {
        const customerData = this.getCustomerPoints(phone);
        const maxRedeemable = Math.min(customerData.points, pointsToRedeem);
        const discountValue = maxRedeemable / this.redemptionRate;

        return {
            pointsToRedeem: maxRedeemable,
            discountValue: discountValue,
            remainingPoints: customerData.points - maxRedeemable
        };
    }

    /**
     * Get points history
     */
    getPointsHistory(phone, limit = 10) {
        const customerData = this.getCustomerPoints(phone);
        return customerData.history.slice(0, limit);
    }

    /**
     * Render loyalty card
     */
    renderLoyaltyCard(phone) {
        const customerData = this.getCustomerPoints(phone);
        const benefits = this.getTierBenefits(customerData.tier);
        const discountValue = customerData.points / this.redemptionRate;

        return `
            <div class="glass-card loyalty-card" style="padding: 2rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <div>
                        <h3 style="margin-bottom: 0.25rem;">Loyalty Rewards</h3>
                        <p style="color: #94a3b8; font-size: 0.875rem;">Earn points with every purchase</p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${customerData.points.toLocaleString()}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Points</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #3b82f6;">${customerData.tier}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Current Tier</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #10b981;">${customerData.totalEarned.toLocaleString()}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Total Earned</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                        <div style="font-size: 1.5rem; font-weight: 600; color: #8b5cf6;">${Utils.formatCurrency(discountValue)}</div>
                        <div style="color: #94a3b8; font-size: 0.875rem;">Available Discount</div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h4 style="margin-bottom: 0.75rem;">Tier Benefits</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8;">
                            <i class="fas fa-${benefits.pointsMultiplier > 1 ? 'check-circle' : 'times-circle'}" 
                               style="color: ${benefits.pointsMultiplier > 1 ? '#10b981' : '#64748b'}"></i>
                            <span>${benefits.pointsMultiplier}x Points Multiplier</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8;">
                            <i class="fas fa-${benefits.discountPercentage > 0 ? 'check-circle' : 'times-circle'}" 
                               style="color: ${benefits.discountPercentage > 0 ? '#10b981' : '#64748b'}"></i>
                            <span>${benefits.discountPercentage}% Discount</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8;">
                            <i class="fas fa-${benefits.prioritySupport ? 'check-circle' : 'times-circle'}" 
                               style="color: ${benefits.prioritySupport ? '#10b981' : '#64748b'}"></i>
                            <span>Priority Support</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8;">
                            <i class="fas fa-${benefits.exclusiveOffers ? 'check-circle' : 'times-circle'}" 
                               style="color: ${benefits.exclusiveOffers ? '#10b981' : '#64748b'}"></i>
                            <span>Exclusive Offers</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem;">
                    <button class="btn btn-primary" onclick="loyaltyManager.showRedeemModal('${phone}')">
                        <i class="fas fa-gift"></i> Redeem Points
                    </button>
                    <button class="btn btn-secondary" onclick="loyaltyManager.showHistoryModal('${phone}')">
                        <i class="fas fa-history"></i> View History
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Show redeem points modal
     */
    showRedeemModal(phone) {
        const customerData = this.getCustomerPoints(phone);
        const maxDiscount = customerData.points / this.redemptionRate;

        const content = `
            <form id="redeemPointsForm">
                <div class="form-group">
                    <label class="form-label">Available Points</label>
                    <div style="font-size: 2rem; font-weight: 700; color: #f59e0b;">${customerData.points.toLocaleString()}</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Points to Redeem</label>
                    <input type="number" class="form-input" name="pointsToRedeem" 
                           min="0" max="${customerData.points}" value="${customerData.points}"
                           onchange="loyaltyManager.updateDiscountPreview(this.value)">
                </div>
                <div class="form-group">
                    <label class="form-label">Discount Value</label>
                    <div id="discountPreview" style="font-size: 1.5rem; font-weight: 700; color: #10b981;">
                        ${Utils.formatCurrency(maxDiscount)}
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-gift"></i> Redeem Points
                </button>
            </form>
        `;

        modalManager.create('redeem-points', 'Redeem Points', content);
        modalManager.open('redeem-points');

        const form = document.getElementById('redeemPointsForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const pointsToRedeem = parseInt(form.pointsToRedeem.value);
            const result = this.redeemPoints(phone, pointsToRedeem, 'Point Redemption');

            if (result.success) {
                modalManager.close('redeem-points');
                toast.success(`Redeemed ${pointsToRedeem} points for ${Utils.formatCurrency(result.discountValue)} discount!`);
                
                // Refresh loyalty card if displayed
                const loyaltyCard = document.querySelector('.loyalty-card');
                if (loyaltyCard) {
                    loyaltyCard.outerHTML = this.renderLoyaltyCard(phone);
                }
            } else {
                toast.error(result.message);
            }
        });
    }

    /**
     * Update discount preview
     */
    updateDiscountPreview(points) {
        const discountValue = points / this.redemptionRate;
        document.getElementById('discountPreview').textContent = Utils.formatCurrency(discountValue);
    }

    /**
     * Show history modal
     */
    showHistoryModal(phone) {
        const history = this.getPointsHistory(phone, 20);

        const content = `
            <div style="max-height: 400px; overflow-y: auto;">
                ${history.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>No History Yet</h3>
                        <p>Start earning points with your first purchase!</p>
                    </div>
                ` : history.map(item => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                        <div>
                            <h4 style="font-weight: 600; margin-bottom: 0.25rem;">${item.reason}</h4>
                            <p style="color: #94a3b8; font-size: 0.875rem;">${Utils.formatDate(item.timestamp)}</p>
                        </div>
                        <div style="font-weight: 700; color: ${item.type === 'earned' ? '#10b981' : '#ef4444'};">
                            ${item.type === 'earned' ? '+' : ''}${item.points}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        modalManager.create('points-history', 'Points History', content);
        modalManager.open('points-history');
    }

    /**
     * Get loyalty statistics
     */
    getStatistics() {
        const allCustomers = Object.values(this.customerPoints);
        
        const tierCounts = {
            Bronze: 0,
            Silver: 0,
            Gold: 0,
            Platinum: 0
        };

        let totalPoints = 0;
        let totalRedeemed = 0;

        allCustomers.forEach(customer => {
            tierCounts[customer.tier]++;
            totalPoints += customer.points;
            totalRedeemed += customer.totalRedeemed;
        });

        return {
            totalCustomers: allCustomers.length,
            tierCounts,
            totalPoints,
            totalRedeemed,
            totalEarned: allCustomers.reduce((sum, c) => sum + c.totalEarned, 0),
            averagePoints: allCustomers.length > 0 ? totalPoints / allCustomers.length : 0
        };
    }
}

// Create global instance
const loyaltyManager = new LoyaltyManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loyaltyManager.init();
});
