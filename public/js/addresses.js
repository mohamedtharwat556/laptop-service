/**
 * YAS Laptop Service Center - Address Manager
 * Handles multiple shipping addresses for customers
 */

class AddressManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadAddresses();
    }

    /**
     * Load addresses from storage
     */
    loadAddresses() {
        this.addresses = storage.get('customerAddresses') || {};
    }

    /**
     * Save addresses to storage
     */
    saveAddresses() {
        storage.set('customerAddresses', this.addresses);
    }

    /**
     * Get addresses by phone number
     */
    getAddresses(phone) {
        return this.addresses[phone] || [];
    }

    /**
     * Add new address
     */
    addAddress(phone, addressData) {
        if (!this.addresses[phone]) {
            this.addresses[phone] = [];
        }

        const newAddress = {
            id: storage.generateId(),
            ...addressData,
            isDefault: this.addresses[phone].length === 0, // First address is default
            createdAt: new Date().toISOString()
        };

        this.addresses[phone].push(newAddress);
        this.saveAddresses();

        return newAddress;
    }

    /**
     * Update address
     */
    updateAddress(phone, addressId, addressData) {
        const addresses = this.getAddresses(phone);
        const index = addresses.findIndex(a => a.id === addressId);

        if (index !== -1) {
            addresses[index] = { ...addresses[index], ...addressData };
            this.addresses[phone] = addresses;
            this.saveAddresses();
            return addresses[index];
        }

        return null;
    }

    /**
     * Delete address
     */
    deleteAddress(phone, addressId) {
        const addresses = this.getAddresses(phone);
        const addressToDelete = addresses.find(a => a.id === addressId);

        if (addressToDelete && addressToDelete.isDefault) {
            // Cannot delete default address
            return {
                success: false,
                message: 'Cannot delete default address. Set another address as default first.'
            };
        }

        const filteredAddresses = addresses.filter(a => a.id !== addressId);
        this.addresses[phone] = filteredAddresses;
        this.saveAddresses();

        return {
            success: true,
            message: 'Address deleted successfully'
        };
    }

    /**
     * Set default address
     */
    setDefaultAddress(phone, addressId) {
        const addresses = this.getAddresses(phone);
        
        addresses.forEach(address => {
            address.isDefault = (address.id === addressId);
        });

        this.addresses[phone] = addresses;
        this.saveAddresses();

        return {
            success: true,
            message: 'Default address updated'
        };
    }

    /**
     * Get default address
     */
    getDefaultAddress(phone) {
        const addresses = this.getAddresses(phone);
        return addresses.find(a => a.isDefault) || addresses[0] || null;
    }

    /**
     * Render address list
     */
    renderAddressList(phone) {
        const addresses = this.getAddresses(phone);

        if (addresses.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-map-marker-alt"></i>
                    <h3>No Saved Addresses</h3>
                    <p>Add a shipping address to get started.</p>
                    <button class="btn btn-primary" onclick="addressManager.showAddAddressModal('${phone}')" style="margin-top: 1rem;">
                        <i class="fas fa-plus"></i> Add Address
                    </button>
                </div>
            `;
        }

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h3>Saved Addresses</h3>
                <button class="btn btn-primary" onclick="addressManager.showAddAddressModal('${phone}')">
                    <i class="fas fa-plus"></i> Add Address
                </button>
            </div>
            <div style="display: grid; gap: 1rem;">
                ${addresses.map(address => this.renderAddressCard(phone, address)).join('')}
            </div>
        `;
    }

    /**
     * Render address card
     */
    renderAddressCard(phone, address) {
        return `
            <div class="glass-card" style="padding: 1.5rem; ${address.isDefault ? 'border: 2px solid #10b981;' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        ${address.isDefault ? `
                            <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #10b981; color: white; border-radius: 20px; font-size: 0.75rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-check"></i> Default
                            </span>
                        ` : ''}
                        <h4 style="font-weight: 600; margin-bottom: 0.5rem;">${address.label || 'Address'}</h4>
                        <p style="color: var(--text-muted-more); margin-bottom: 0.25rem;">${address.fullName}</p>
                        <p style="color: var(--text-muted-more); margin-bottom: 0.25rem;">${address.phone}</p>
                        <p style="color: var(--text-muted);">${address.addressLine1}</p>
                        ${address.addressLine2 ? `<p style="color: var(--text-muted);">${address.addressLine2}</p>` : ''}
                        <p style="color: var(--text-muted-more);">${address.city}, ${address.state} ${address.postalCode}</p>
                        <p style="color: var(--text-muted-more);">${address.country}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        ${!address.isDefault ? `
                            <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                    onclick="addressManager.setDefaultAddress('${phone}', '${address.id}')">
                                <i class="fas fa-star"></i> Set Default
                            </button>
                        ` : ''}
                        <button class="btn btn-primary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                onclick="addressManager.showEditAddressModal('${phone}', '${address.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                onclick="addressManager.deleteAddress('${phone}', '${address.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Show add address modal
     */
    showAddAddressModal(phone) {
        const content = `
            <form id="addAddressForm">
                <div class="form-group">
                    <label class="form-label">Address Label *</label>
                    <input type="text" class="form-input" name="label" required placeholder="e.g., Home, Work">
                </div>
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" name="fullName" required placeholder="Recipient name">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-input" name="phone" required placeholder="Contact phone">
                </div>
                <div class="form-group">
                    <label class="form-label">Address Line 1 *</label>
                    <input type="text" class="form-input" name="addressLine1" required placeholder="Street address">
                </div>
                <div class="form-group">
                    <label class="form-label">Address Line 2</label>
                    <input type="text" class="form-input" name="addressLine2" placeholder="Apartment, suite, etc.">
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">City *</label>
                        <input type="text" class="form-input" name="city" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">State/Province *</label>
                        <input type="text" class="form-input" name="state" required>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Postal Code *</label>
                        <input type="text" class="form-input" name="postalCode" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Country *</label>
                        <input type="text" class="form-input" name="country" required value="United States">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> Add Address
                </button>
            </form>
        `;

        modalManager.create('add-address', 'Add New Address', content);
        modalManager.open('add-address');

        const form = document.getElementById('addAddressForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const addressData = {
                label: form.label.value,
                fullName: form.fullName.value,
                phone: form.phone.value,
                addressLine1: form.addressLine1.value,
                addressLine2: form.addressLine2.value,
                city: form.city.value,
                state: form.state.value,
                postalCode: form.postalCode.value,
                country: form.country.value
            };

            this.addAddress(phone, addressData);
            modalManager.close('add-address');
            toast.success('Address added successfully!');

            // Refresh address list if displayed
            const addressList = document.querySelector('.address-list');
            if (addressList) {
                addressList.innerHTML = this.renderAddressList(phone);
            }
        });
    }

    /**
     * Show edit address modal
     */
    showEditAddressModal(phone, addressId) {
        const address = this.getAddresses(phone).find(a => a.id === addressId);
        if (!address) return;

        const content = `
            <form id="editAddressForm">
                <div class="form-group">
                    <label class="form-label">Address Label *</label>
                    <input type="text" class="form-input" name="label" required value="${address.label}">
                </div>
                <div class="form-group">
                    <label class="form-label">Full Name *</label>
                    <input type="text" class="form-input" name="fullName" required value="${address.fullName}">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-input" name="phone" required value="${address.phone}">
                </div>
                <div class="form-group">
                    <label class="form-label">Address Line 1 *</label>
                    <input type="text" class="form-input" name="addressLine1" required value="${address.addressLine1}">
                </div>
                <div class="form-group">
                    <label class="form-label">Address Line 2</label>
                    <input type="text" class="form-input" name="addressLine2" value="${address.addressLine2 || ''}">
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">City *</label>
                        <input type="text" class="form-input" name="city" required value="${address.city}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">State/Province *</label>
                        <input type="text" class="form-input" name="state" required value="${address.state}">
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Postal Code *</label>
                        <input type="text" class="form-input" name="postalCode" required value="${address.postalCode}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Country *</label>
                        <input type="text" class="form-input" name="country" required value="${address.country}">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> Update Address
                </button>
            </form>
        `;

        modalManager.create('edit-address', 'Edit Address', content);
        modalManager.open('edit-address');

        const form = document.getElementById('editAddressForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const addressData = {
                label: form.label.value,
                fullName: form.fullName.value,
                phone: form.phone.value,
                addressLine1: form.addressLine1.value,
                addressLine2: form.addressLine2.value,
                city: form.city.value,
                state: form.state.value,
                postalCode: form.postalCode.value,
                country: form.country.value
            };

            this.updateAddress(phone, addressId, addressData);
            modalManager.close('edit-address');
            toast.success('Address updated successfully!');

            // Refresh address list if displayed
            const addressList = document.querySelector('.address-list');
            if (addressList) {
                addressList.innerHTML = this.renderAddressList(phone);
            }
        });
    }

    /**
     * Render address selector for checkout
     */
    renderAddressSelector(phone) {
        const addresses = this.getAddresses(phone);
        const defaultAddress = this.getDefaultAddress(phone);

        if (addresses.length === 0) {
            return `
                <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem;">
                    <p style="color: #94a3b8; margin-bottom: 1rem;">No saved addresses. Add one to speed up checkout.</p>
                    <button class="btn btn-primary" onclick="addressManager.showAddAddressModal('${phone}')">
                        <i class="fas fa-plus"></i> Add Address
                    </button>
                </div>
                <div class="form-group">
                    <label class="form-label">Delivery Address *</label>
                    <textarea class="form-textarea" name="customerAddress" required placeholder="Enter your delivery address"></textarea>
                </div>
            `;
        }

        return `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem;">
                <h3 style="margin-bottom: 1rem;">Select Delivery Address</h3>
                <div class="address-selector-list" style="display: grid; gap: 1rem; margin-bottom: 1rem;">
                    ${addresses.map(address => `
                        <div class="address-option" style="padding: 1rem; border: 2px solid ${address.isDefault ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;" 
                             onclick="addressManager.selectAddress('${address.id}')"
                             data-address-id="${address.id}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.5rem;">
                                        ${address.label} ${address.isDefault ? '<span style="color: #10b981; font-size: 0.75rem;">(Default)</span>' : ''}
                                    </div>
                                    <p style="color: var(--text-muted-more); font-size: 0.875rem;">${address.fullName}</p>
                                    <p style="color: var(--text-muted);">${address.addressLine1}, ${address.city}, ${address.state} ${address.postalCode}</p>
                                </div>
                                <i class="fas fa-${address.isDefault ? 'check-circle' : 'circle'}" style="color: ${address.isDefault ? '#10b981' : '#64748b'}"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-secondary" onclick="addressManager.showAddAddressModal('${phone}')">
                    <i class="fas fa-plus"></i> Add New Address
                </button>
            </div>
            <input type="hidden" name="selectedAddressId" id="selectedAddressId" value="${defaultAddress?.id || ''}">
            <input type="hidden" name="customerAddress" id="customerAddress" value="${defaultAddress ? this.formatAddress(defaultAddress) : ''}">
        `;
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        const parts = [
            address.addressLine1,
            address.addressLine2,
            address.city,
            address.state,
            address.postalCode,
            address.country
        ].filter(Boolean);

        return parts.join(', ');
    }

    /**
     * Select address for checkout
     */
    selectAddress(addressId) {
        document.querySelectorAll('.address-option').forEach(option => {
            option.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            option.querySelector('i').className = 'fas fa-circle';
            option.querySelector('i').style.color = '#64748b';
        });

        const selectedOption = document.querySelector(`[data-address-id="${addressId}"]`);
        if (selectedOption) {
            selectedOption.style.borderColor = '#10b981';
            selectedOption.querySelector('i').className = 'fas fa-check-circle';
            selectedOption.querySelector('i').style.color = '#10b981';
        }

        document.getElementById('selectedAddressId').value = addressId;
    }
}

// Create global instance
const addressManager = new AddressManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    addressManager.init();
});
