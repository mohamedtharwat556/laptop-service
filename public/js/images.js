/**
 * YAS Laptop Service Center - Image Manager
 * Handles image upload for before/after repair
 */

class ImageManager {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        this.init();
    }

    init() {
        this.loadImages();
    }

    /**
     * Load images from storage
     */
    loadImages() {
        this.images = storage.get('repairImages') || {};
    }

    /**
     * Save images to storage
     */
    saveImages() {
        storage.set('repairImages', this.images);
    }

    /**
     * Get images by request ID
     */
    getImagesByRequestId(requestId) {
        return this.images[requestId] || { before: [], after: [] };
    }

    /**
     * Upload image (converts to base64 for storage)
     */
    async uploadImage(file, requestId, type = 'before') {
        // Validate file type
        if (!this.allowedTypes.includes(file.type)) {
            return {
                success: false,
                message: 'Invalid file type. Please upload JPEG, PNG, or WebP images.'
            };
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
            return {
                success: false,
                message: 'File size exceeds 5MB limit.'
            };
        }

        try {
            const base64 = await this.fileToBase64(file);
            
            if (!this.images[requestId]) {
                this.images[requestId] = { before: [], after: [] };
            }

            const imageData = {
                id: storage.generateId(),
                data: base64,
                name: file.name,
                type: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };

            this.images[requestId][type].push(imageData);
            this.saveImages();

            return {
                success: true,
                image: imageData
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to upload image: ' + error.message
            };
        }
    }

    /**
     * Convert file to base64
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Delete image
     */
    deleteImage(requestId, imageId, type) {
        if (!this.images[requestId]) return false;

        this.images[requestId][type] = this.images[requestId][type].filter(
            img => img.id !== imageId
        );

        this.saveImages();
        return true;
    }

    /**
     * Render image upload section
     */
    renderImageUploadSection(requestId) {
        const images = this.getImagesByRequestId(requestId);

        return `
            <div class="image-upload-section" style="margin-top: 2rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">Before Repair</h3>
                        <div class="upload-zone" id="beforeUploadZone" 
                             style="border: 2px dashed var(--border-dashed); border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease;"
                             ondragover="imageManager.handleDragOver(event, this)"
                             ondragleave="imageManager.handleDragLeave(event, this)"
                             ondrop="imageManager.handleDrop(event, '${requestId}', 'before', this)">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--text-muted-more); margin-bottom: 1rem;"></i>
                            <p style="color: var(--text-muted-more); margin-bottom: 1rem;">Drag & drop images here or click to upload</p>
                            <input type="file" id="beforeImageInput" accept="image/*" multiple style="display: none;"
                                   onchange="imageManager.handleFileSelect(event, '${requestId}', 'before')">
                            <button class="btn btn-secondary" onclick="document.getElementById('beforeImageInput').click()">
                                <i class="fas fa-upload"></i> Select Images
                            </button>
                        </div>
                        <div id="beforeImageGallery" class="image-gallery" style="margin-top: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                            ${images.before.map(img => this.renderImageThumbnail(img, requestId, 'before')).join('')}
                        </div>
                    </div>

                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="margin-bottom: 1rem;">After Repair</h3>
                        <div class="upload-zone" id="afterUploadZone"
                             style="border: 2px dashed var(--border-dashed); border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease;"
                             ondragover="imageManager.handleDragOver(event, this)"
                             ondragleave="imageManager.handleDragLeave(event, this)"
                             ondrop="imageManager.handleDrop(event, '${requestId}', 'after', this)">
                            <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--text-muted-more); margin-bottom: 1rem;"></i>
                            <p style="color: var(--text-muted-more); margin-bottom: 1rem;">Drag & drop images here or click to upload</p>
                            <input type="file" id="afterImageInput" accept="image/*" multiple style="display: none;"
                                   onchange="imageManager.handleFileSelect(event, '${requestId}', 'after')">
                            <button class="btn btn-secondary" onclick="document.getElementById('afterImageInput').click()">
                                <i class="fas fa-upload"></i> Select Images
                            </button>
                        </div>
                        <div id="afterImageGallery" class="image-gallery" style="margin-top: 1rem; display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                            ${images.after.map(img => this.renderImageThumbnail(img, requestId, 'after')).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render image thumbnail
     */
    renderImageThumbnail(image, requestId, type) {
        return `
            <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: rgba(0, 0, 0, 0.3);">
                <img src="${image.data}" alt="${image.name}" 
                     style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;"
                     onclick="imageManager.showImageModal('${image.data}', '${image.name}')">
                <button onclick="imageManager.deleteImage('${requestId}', '${image.id}', '${type}')" 
                        style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(239, 68, 68, 0.9); border: none; color: white; padding: 0.375rem; border-radius: 4px; cursor: pointer;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    /**
     * Handle drag over
     */
    handleDragOver(event, element) {
        event.preventDefault();
        element.style.borderColor = '#3b82f6';
        element.style.background = 'rgba(59, 130, 246, 0.1)';
    }

    /**
     * Handle drag leave
     */
    handleDragLeave(event, element) {
        event.preventDefault();
        element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        element.style.background = 'transparent';
    }

    /**
     * Handle drop
     */
    async handleDrop(event, requestId, type, element) {
        event.preventDefault();
        element.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        element.style.background = 'transparent';

        const files = event.dataTransfer.files;
        for (const file of files) {
            const result = await this.uploadImage(file, requestId, type);
            if (result.success) {
                toast.success(`Uploaded ${file.name}`);
            } else {
                toast.error(result.message);
            }
        }

        // Refresh gallery
        this.refreshGallery(requestId, type);
    }

    /**
     * Handle file select
     */
    async handleFileSelect(event, requestId, type) {
        const files = event.target.files;
        for (const file of files) {
            const result = await this.uploadImage(file, requestId, type);
            if (result.success) {
                toast.success(`Uploaded ${file.name}`);
            } else {
                toast.error(result.message);
            }
        }

        // Refresh gallery
        this.refreshGallery(requestId, type);
    }

    /**
     * Refresh image gallery
     */
    refreshGallery(requestId, type) {
        const images = this.getImagesByRequestId(requestId);
        const gallery = document.getElementById(`${type}ImageGallery`);
        if (gallery) {
            gallery.innerHTML = images[type].map(img => this.renderImageThumbnail(img, requestId, type)).join('');
        }
    }

    /**
     * Show image modal
     */
    showImageModal(imageData, imageName) {
        const content = `
            <div style="text-align: center;">
                <img src="${imageData}" alt="${imageName}" 
                     style="max-width: 100%; max-height: 70vh; border-radius: 8px;">
                <p style="margin-top: 1rem; color: var(--text-muted-more);">${imageName}</p>
            </div>
        `;

        modalManager.create('image-view', 'Image Preview', content);
        modalManager.open('image-view');
    }

    /**
     * Render image comparison view
     */
    renderComparisonView(requestId) {
        const images = this.getImagesByRequestId(requestId);

        if (images.before.length === 0 && images.after.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-images"></i>
                    <h3>No Images Uploaded</h3>
                    <p>No before/after images available for this request.</p>
                </div>
            `;
        }

        return `
            <div class="comparison-view" style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">Before & After Comparison</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div>
                        <h4 style="margin-bottom: 1rem; color: #ef4444;">Before Repair</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                            ${images.before.length > 0 ? 
                                images.before.map(img => this.renderImageThumbnail(img, requestId, 'before')).join('') :
                                '<div style="padding: 2rem; background: var(--card-bg-subtle); border-radius: 8px; text-align: center; color: var(--text-muted-more);">No images</div>'
                            }
                        </div>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 1rem; color: #10b981;">After Repair</h4>
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem;">
                            ${images.after.length > 0 ?
                                images.after.map(img => this.renderImageThumbnail(img, requestId, 'after')).join('') :
                                '<div style="padding: 2rem; background: var(--card-bg-subtle); border-radius: 8px; text-align: center; color: var(--text-muted-more);">No images</div>'
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get image statistics
     */
    getStatistics() {
        let totalImages = 0;
        let totalSize = 0;
        const byRequest = {};

        for (const requestId in this.images) {
            const requestImages = this.images[requestId];
            const beforeCount = requestImages.before.length;
            const afterCount = requestImages.after.length;
            
            totalImages += beforeCount + afterCount;
            totalSize += requestImages.before.reduce((sum, img) => sum + img.size, 0);
            totalSize += requestImages.after.reduce((sum, img) => sum + img.size, 0);

            byRequest[requestId] = {
                before: beforeCount,
                after: afterCount,
                total: beforeCount + afterCount
            };
        }

        return {
            totalImages,
            totalSize: (totalSize / (1024 * 1024)).toFixed(2), // in MB
            totalRequests: Object.keys(this.images).length,
            byRequest
        };
    }

    /**
     * Cleanup old images (optional)
     */
    cleanupOldImages(daysToKeep = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        let deletedCount = 0;

        for (const requestId in this.images) {
            const requestImages = this.images[requestId];
            
            requestImages.before = requestImages.before.filter(img => {
                if (new Date(img.uploadedAt) < cutoffDate) {
                    deletedCount++;
                    return false;
                }
                return true;
            });

            requestImages.after = requestImages.after.filter(img => {
                if (new Date(img.uploadedAt) < cutoffDate) {
                    deletedCount++;
                    return false;
                }
                return true;
            });

            // Remove empty entries
            if (requestImages.before.length === 0 && requestImages.after.length === 0) {
                delete this.images[requestId];
            }
        }

        this.saveImages();
        return deletedCount;
    }
}

// Create global instance
const imageManager = new ImageManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    imageManager.init();
});
