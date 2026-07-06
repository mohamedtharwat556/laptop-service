/**
 * YAS Laptop Service Center - Appointment Manager
 * Handles appointment scheduling system
 */

class AppointmentManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadAppointments();
    }

    /**
     * Load appointments from storage
     */
    loadAppointments() {
        this.appointments = storage.get('appointments') || [];
    }

    /**
     * Save appointments to storage
     */
    saveAppointments() {
        storage.set('appointments', this.appointments);
    }

    /**
     * Get appointments by phone number
     */
    getAppointments(phone) {
        return this.appointments.filter(a => a.phone === phone);
    }

    /**
     * Get appointments by date
     */
    getAppointmentsByDate(date) {
        const dateStr = new Date(date).toDateString();
        return this.appointments.filter(a => new Date(a.date).toDateString() === dateStr);
    }

    /**
     * Get appointments by technician
     */
    getAppointmentsByTechnician(technicianId) {
        return this.appointments.filter(a => a.technicianId === technicianId);
    }

    /**
     * Create new appointment
     */
    createAppointment(appointmentData) {
        const newAppointment = {
            id: storage.generateId(),
            ...appointmentData,
            status: 'Scheduled',
            createdAt: new Date().toISOString()
        };

        this.appointments.push(newAppointment);
        this.saveAppointments();

        return newAppointment;
    }

    /**
     * Update appointment
     */
    updateAppointment(appointmentId, appointmentData) {
        const index = this.appointments.findIndex(a => a.id === appointmentId);
        if (index !== -1) {
            this.appointments[index] = { ...this.appointments[index], ...appointmentData };
            this.saveAppointments();
            return this.appointments[index];
        }
        return null;
    }

    /**
     * Cancel appointment
     */
    cancelAppointment(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (appointment) {
            appointment.status = 'Cancelled';
            appointment.cancelledAt = new Date().toISOString();
            this.saveAppointments();
            return appointment;
        }
        return null;
    }

    /**
     * Complete appointment
     */
    completeAppointment(appointmentId) {
        const appointment = this.appointments.find(a => a.id === appointmentId);
        if (appointment) {
            appointment.status = 'Completed';
            appointment.completedAt = new Date().toISOString();
            this.saveAppointments();
            return appointment;
        }
        return null;
    }

    /**
     * Check if time slot is available
     */
    isTimeSlotAvailable(date, time, technicianId = null) {
        const dateStr = new Date(date).toDateString();
        const dayAppointments = this.appointments.filter(a => 
            new Date(a.date).toDateString() === dateStr &&
            a.status !== 'Cancelled'
        );

        // Check if the specific time slot is taken
        const isSlotTaken = dayAppointments.some(a => a.time === time);
        
        if (isSlotTaken) return false;

        // If technician specified, check their availability
        if (technicianId) {
            const technicianAppointments = dayAppointments.filter(a => a.technicianId === technicianId);
            const isTechnicianBusy = technicianAppointments.some(a => a.time === time);
            if (isTechnicianBusy) return false;
        }

        return true;
    }

    /**
     * Get available time slots for a date
     */
    getAvailableTimeSlots(date, technicianId = null) {
        const timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        const availableSlots = timeSlots.filter(time => 
            this.isTimeSlotAvailable(date, time, technicianId)
        );

        return availableSlots;
    }

    /**
     * Render appointment calendar
     */
    renderAppointmentCalendar() {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];

        let calendarHTML = `
            <div class="glass-card" style="padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3>${monthNames[currentMonth]} ${currentYear}</h3>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="appointmentManager.changeMonth(-1)">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="btn btn-secondary" onclick="appointmentManager.changeMonth(1)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center;">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `
                        <div style="font-weight: 600; color: #94a3b8; padding: 0.5rem;">${day}</div>
                    `).join('')}
                    ${Array(firstDayOfMonth).fill('<div></div>').join('')}
                    ${Array.from({ length: daysInMonth }, (_, i) => {
                        const date = new Date(currentYear, currentMonth, i + 1);
                        const dateStr = date.toDateString();
                        const isToday = date.toDateString() === today.toDateString();
                        const hasAppointments = this.appointments.some(a => 
                            new Date(a.date).toDateString() === dateStr && a.status !== 'Cancelled'
                        );

                        return `
                            <div style="padding: 0.5rem; border-radius: 8px; cursor: pointer; 
                                 background: ${isToday ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
                                 border: ${hasAppointments ? '2px solid #10b981' : 'none'};"
                                 onclick="appointmentManager.selectDate('${date.toISOString()}')">
                                <div style="font-weight: 600;">${i + 1}</div>
                                ${hasAppointments ? '<div style="font-size: 0.75rem; color: #10b981;">●</div>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        return calendarHTML;
    }

    /**
     * Render appointment list for selected date
     */
    renderAppointmentList(date) {
        const dateStr = new Date(date).toDateString();
        const dayAppointments = this.getAppointmentsByDate(date);

        if (dayAppointments.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-calendar-day"></i>
                    <h3>No Appointments</h3>
                    <p>No appointments scheduled for this date.</p>
                </div>
            `;
        }

        return `
            <div class="glass-card" style="padding: 1.5rem;">
                <h3 style="margin-bottom: 1rem;">Appointments for ${new Date(date).toLocaleDateString()}</h3>
                <div style="display: grid; gap: 1rem;">
                    ${dayAppointments.map(appointment => `
                        <div style="padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid ${this.getStatusColor(appointment.status)};">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div>
                                    <div style="font-weight: 600; margin-bottom: 0.25rem;">${appointment.time}</div>
                                    <p style="color: #94a3b8; font-size: 0.875rem;">${appointment.customerName}</p>
                                    <p style="color: #94a3b8; font-size: 0.875rem;">${appointment.serviceType}</p>
                                </div>
                                <div style="text-align: right;">
                                    <span class="status-badge status-${this.getStatusClass(appointment.status)}">${appointment.status}</span>
                                    <p style="color: #94a3b8; font-size: 0.875rem; margin-top: 0.5rem;">${appointment.phone}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        const colors = {
            'Scheduled': '#3b82f6',
            'Confirmed': '#10b981',
            'In Progress': '#f59e0b',
            'Completed': '#22c55e',
            'Cancelled': '#ef4444',
            'No Show': '#64748b'
        };
        return colors[status] || '#3b82f6';
    }

    /**
     * Get status class
     */
    getStatusClass(status) {
        const classes = {
            'Scheduled': 'received',
            'Confirmed': 'ready',
            'In Progress': 'waiting-inspection',
            'Completed': 'delivered',
            'Cancelled': 'waiting-parts',
            'No Show': 'waiting-parts'
        };
        return classes[status] || 'received';
    }

    /**
     * Show book appointment modal
     */
    showBookAppointmentModal(phone = null) {
        const technicians = storage.getUsers().filter(u => u.role === 'technician');

        const content = `
            <form id="bookAppointmentForm">
                <div class="form-group">
                    <label class="form-label">Customer Name *</label>
                    <input type="text" class="form-input" name="customerName" required placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label class="form-label">Phone Number *</label>
                    <input type="tel" class="form-input" name="phone" required placeholder="Enter your phone number" value="${phone || ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Service Type *</label>
                    <select class="form-select" name="serviceType" required>
                        <option value="">Select service</option>
                        <option value="Diagnostic">Diagnostic</option>
                        <option value="Repair">Repair</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Upgrade">Upgrade</option>
                        <option value="Consultation">Consultation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Date *</label>
                    <input type="date" class="form-input" name="date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label class="form-label">Time *</label>
                    <select class="form-select" name="time" required id="timeSlotSelect">
                        <option value="">Select date first</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Preferred Technician</label>
                    <select class="form-select" name="technicianId">
                        <option value="">Any available technician</option>
                        ${technicians.map(t => `
                            <option value="${t.id}">${t.name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" rows="3" placeholder="Any additional information..."></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-calendar-plus"></i> Book Appointment
                </button>
            </form>
        `;

        modalManager.create('book-appointment', 'Book Appointment', content);
        modalManager.open('book-appointment');

        const form = document.getElementById('bookAppointmentForm');
        const dateInput = form.querySelector('[name="date"]');
        const timeSelect = form.querySelector('#timeSlotSelect');

        dateInput.addEventListener('change', () => {
            const technicianId = form.technicianId.value;
            const availableSlots = this.getAvailableTimeSlots(dateInput.value, technicianId || null);
            
            timeSelect.innerHTML = '<option value="">Select time</option>' +
                availableSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
        });

        form.technicianId.addEventListener('change', () => {
            if (dateInput.value) {
                const availableSlots = this.getAvailableTimeSlots(dateInput.value, form.technicianId.value || null);
                timeSelect.innerHTML = '<option value="">Select time</option>' +
                    availableSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const appointmentData = {
                customerName: form.customerName.value,
                phone: form.phone.value,
                serviceType: form.serviceType.value,
                date: form.date.value,
                time: form.time.value,
                technicianId: form.technicianId.value || null,
                notes: form.notes.value
            };

            this.createAppointment(appointmentData);
            modalManager.close('book-appointment');
            toast.success('Appointment booked successfully!');

            // Refresh appointment list if displayed
            const appointmentList = document.querySelector('.appointment-list');
            if (appointmentList) {
                appointmentList.innerHTML = this.renderAppointmentList(appointmentData.date);
            }
        });
    }

    /**
     * Get appointment statistics
     */
    getStatistics() {
        const today = new Date();
        const todayStr = today.toDateString();
        const thisMonth = today.getMonth();
        const thisYear = today.getFullYear();

        const stats = {
            total: this.appointments.length,
            today: this.appointments.filter(a => new Date(a.date).toDateString() === todayStr).length,
            thisMonth: this.appointments.filter(a => {
                const d = new Date(a.date);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            }).length,
            byStatus: {},
            byService: {}
        };

        this.appointments.forEach(a => {
            stats.byStatus[a.status] = (stats.byStatus[a.status] || 0) + 1;
            stats.byService[a.serviceType] = (stats.byService[a.serviceType] || 0) + 1;
        });

        return stats;
    }

    /**
     * Render appointment dashboard
     */
    renderAppointmentDashboard() {
        const stats = this.getStatistics();

        return `
            <div class="appointment-dashboard">
                <div class="dashboard-header">
                    <h2>Appointment Management</h2>
                    <button class="btn btn-primary" onclick="appointmentManager.showBookAppointmentModal()">
                        <i class="fas fa-plus"></i> Book Appointment
                    </button>
                </div>

                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-calendar"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.total}</h3>
                            <p>Total Appointments</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-calendar-day"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.today}</h3>
                            <p>Today</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-calendar-week"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.thisMonth}</h3>
                            <p>This Month</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
                    <div id="appointmentCalendar"></div>
                    <div id="appointmentList" class="appointment-list"></div>
                </div>
            </div>
        `;
    }

    /**
     * Select date from calendar
     */
    selectDate(date) {
        const appointmentList = document.getElementById('appointmentList');
        if (appointmentList) {
            appointmentList.innerHTML = this.renderAppointmentList(date);
        }
    }

    /**
     * Change month in calendar
     */
    changeMonth(delta) {
        // Implementation would go here to update calendar view
        // For simplicity, we'll just reload the current month
        const calendarContainer = document.getElementById('appointmentCalendar');
        if (calendarContainer) {
            calendarContainer.innerHTML = this.renderAppointmentCalendar();
        }
    }
}

// Create global instance
const appointmentManager = new AppointmentManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    appointmentManager.init();
});
