const { query, insert, update, getById } = require('./database');

/**
 * Submit a rating for a completed request
 * @param {string} requestId - Request ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @returns {object} - Result
 */
async function submitRating(requestId, rating, comment = '') {
    try {
        // Validate rating
        if (rating < 1 || rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        // Check if request exists and is completed
        const request = await getById('requests', requestId);
        
        if (!request.data) {
            return { success: false, error: 'Request not found' };
        }

        if (request.data.status !== 'Completed') {
            return { success: false, error: 'Can only rate completed requests' };
        }

        // Check if already rated
        if (request.data.rating) {
            return { success: false, error: 'Request already rated' };
        }

        // Update request with rating
        const result = await update('requests', requestId, {
            rating,
            ratingComment: comment,
            ratedAt: new Date().toISOString()
        });

        if (result.error) {
            return { success: false, error: result.error };
        }

        console.log(`Rating submitted for request ${requestId}: ${rating} stars`);
        
        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error submitting rating:', error);
        return { success: false, error };
    }
}

/**
 * Get all ratings
 * @returns {object} - Result with ratings data
 */
async function getAllRatings() {
    try {
        const result = await query('requests', {
            select: 'id, requestNumber, fullName, rating, ratingComment, ratedAt, deviceType',
            filters: [{ column: 'rating', operator: 'not.is', value: null }],
            order: { column: 'ratedAt', ascending: false }
        });

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error getting ratings:', error);
        return { success: false, error };
    }
}

/**
 * Get rating statistics
 * @returns {object} - Rating statistics
 */
async function getRatingStats() {
    try {
        const result = await query('requests', {
            select: 'rating',
            filters: [{ column: 'rating', operator: 'not.is', value: null }]
        });

        if (result.error) {
            return { success: false, error: result.error };
        }

        const ratings = result.data;
        const total = ratings.length;

        if (total === 0) {
            return {
                success: true,
                stats: {
                    average: 0,
                    total: 0,
                    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
                }
            };
        }

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        const average = (sum / total).toFixed(1);

        // Calculate distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(r => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        return {
            success: true,
            stats: {
                average,
                total,
                distribution
            }
        };
    } catch (error) {
        console.error('Error getting rating stats:', error);
        return { success: false, error };
    }
}

/**
 * Get recent ratings with limit
 * @param {number} limit - Number of recent ratings
 * @returns {object} - Result with recent ratings
 */
async function getRecentRatings(limit = 10) {
    try {
        const result = await query('requests', {
            select: 'id, requestNumber, fullName, rating, ratingComment, ratedAt, deviceType',
            filters: [{ column: 'rating', operator: 'not.is', value: null }],
            order: { column: 'ratedAt', ascending: false },
            limit
        });

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error getting recent ratings:', error);
        return { success: false, error };
    }
}

/**
 * Get ratings for a specific request
 * @param {string} requestId - Request ID
 * @returns {object} - Result with rating data
 */
async function getRequestRating(requestId) {
    try {
        const result = await getById('requests', requestId, 'rating, ratingComment, ratedAt');

        if (result.error) {
            return { success: false, error: result.error };
        }

        if (!result.data || !result.data.rating) {
            return { success: false, error: 'No rating found for this request' };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error('Error getting request rating:', error);
        return { success: false, error };
    }
}

/**
 * Delete a rating (admin only)
 * @param {string} requestId - Request ID
 * @returns {object} - Result
 */
async function deleteRating(requestId) {
    try {
        const result = await update('requests', requestId, {
            rating: null,
            ratingComment: null,
            ratedAt: null
        });

        if (result.error) {
            return { success: false, error: result.error };
        }

        console.log(`Rating deleted for request ${requestId}`);
        
        return { success: true };
    } catch (error) {
        console.error('Error deleting rating:', error);
        return { success: false, error };
    }
}

/**
 * Generate star rating HTML
 * @param {number} rating - Rating (1-5)
 * @returns {string} - HTML string with stars
 */
function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
        } else if (i - 0.5 <= rating) {
            stars += '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>';
        } else {
            stars += '<i class="far fa-star" style="color: #d1d5db;"></i>';
        }
    }
    return stars;
}

module.exports = {
    submitRating,
    getAllRatings,
    getRatingStats,
    getRecentRatings,
    getRequestRating,
    deleteRating,
    generateStarRating
};
