/**
 * YAS Laptop Service Center - Time Tracking Manager
 * Handles time tracking for repairs
 */

class TimeTrackingManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadTimeEntries();
    }

    /**
     * Load time entries from storage
     */
    loadTimeEntries() {
        this.timeEntries = storage.get('timeEntries') || {};
    }

    /**
     * Save time entries to storage
     */
    saveTimeEntries() {
        storage.set('timeEntries', this.timeEntries);
    }

    /**
     * Get time entries by request ID
     */
    getTimeEntriesByRequestId(requestId) {
        return this.timeEntries[requestId] || [];
    }

    /**
     * Start time tracking for a request
     */
    startTimeTracking(requestId, technicianId, notes = '') {
        if (!this.timeEntries[requestId]) {
            this.timeEntries[requestId] = [];
        }

        // Check if there's an active timer
        const activeTimer = this.timeEntries[requestId].find(entry => !entry.endTime);
        if (activeTimer) {
            return {
                success: false,
                message: 'Timer already running for this request'
            };
        }

        const timeEntry = {
            id: storage.generateId(),
            requestId: requestId,
            technicianId: technicianId,
            startTime: new Date().toISOString(),
            endTime: null,
            duration: null,
            notes: notes,
            status: 'in_progress'
        };

        this.timeEntries[requestId].push(timeEntry);
        this.saveTimeEntries();

        return {
            success: true,
            timeEntry
        };
    }

    /**
     * Stop time tracking for a request
     */
    stopTimeTracking(requestId, timeEntryId) {
        const timeEntry = this.timeEntries[requestId]?.find(entry => entry.id === timeEntryId);
        
        if (!timeEntry) {
            return {
                success: false,
                message: 'Time entry not found'
            };
        }

        if (timeEntry.endTime) {
            return {
                success: false,
                message: 'Timer already stopped'
            };
        }

        timeEntry.endTime = new Date().toISOString();
        timeEntry.duration = new Date(timeEntry.endTime) - new Date(timeEntry.startTime);
        timeEntry.status = 'completed';

        this.saveTimeEntries();

        return {
            success: true,
            timeEntry
        };
    }

    /**
     * Add manual time entry
     */
    addManualTimeEntry(requestId, technicianId, startTime, endTime, notes = '') {
        if (!this.timeEntries[requestId]) {
            this.timeEntries[requestId] = [];
        }

        const duration = new Date(endTime) - new Date(startTime);

        const timeEntry = {
            id: storage.generateId(),
            requestId: requestId,
            technicianId: technicianId,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            notes: notes,
            status: 'completed',
            manual: true
        };

        this.timeEntries[requestId].push(timeEntry);
        this.saveTimeEntries();

        return timeEntry;
    }

    /**
     * Update time entry notes
     */
    updateTimeEntryNotes(requestId, timeEntryId, notes) {
        const timeEntry = this.timeEntries[requestId]?.find(entry => entry.id === timeEntryId);
        
        if (timeEntry) {
            timeEntry.notes = notes;
            this.saveTimeEntries();
            return timeEntry;
        }

        return null;
    }

    /**
     * Delete time entry
     */
    deleteTimeEntry(requestId, timeEntryId) {
        if (!this.timeEntries[requestId]) return false;

        const beforeCount = this.timeEntries[requestId].length;
        this.timeEntries[requestId] = this.timeEntries[requestId].filter(entry => entry.id !== timeEntryId);
        
        if (this.timeEntries[requestId].length < beforeCount) {
            this.saveTimeEntries();
            return true;
        }

        return false;
    }

    /**
     * Get total time for a request
     */
    getTotalTimeForRequest(requestId) {
        const entries = this.getTimeEntriesByRequestId(requestId);
        return entries.reduce((total, entry) => {
            if (entry.duration) {
                return total + entry.duration;
            }
            return total;
        }, 0);
    }

    /**
     * Format duration in human-readable format
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours}h ${remainingMinutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return `${seconds}s`;
        }
    }

    /**
     * Get active timer for a request
     */
    getActiveTimer(requestId) {
        return this.timeEntries[requestId]?.find(entry => !entry.endTime) || null;
    }

    /**
     * Render time tracking section for a request
     */
    renderTimeTrackingSection(requestId, technicianId) {
        const timeEntries = this.getTimeEntriesByRequestId(requestId);
        const activeTimer = this.getActiveTimer(requestId);
        const totalTime = this.getTotalTimeForRequest(requestId);

        return `
            <div class="time-tracking-section" style="margin-top: 2rem;">
                <div class="glass-card" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3>Time Tracking</h3>
                        <div style="text-align: right;">
                            <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">
                                ${this.formatDuration(totalTime)}
                            </div>
                            <p style="color: var(--text-muted-more); font-size: 0.875rem;">Total Time</p>
                        </div>
                    </div>

                    ${activeTimer ? `
                        <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: 8px; margin-bottom: 1rem; border-left: 3px solid #f59e0b;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <span style="color: #f59e0b; font-weight: 600;">Timer Running</span>
                                    <p style="color: var(--text-muted-more); font-size: 0.875rem;">Started at ${Utils.formatDate(activeTimer.startTime)}</p>
                                </div>
                                <button class="btn btn-danger" onclick="timeTrackingManager.stopTimer('${requestId}', '${activeTimer.id}')">
                                    <i class="fas fa-stop"></i> Stop
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                            <button class="btn btn-primary" onclick="timeTrackingManager.startTimer('${requestId}', '${technicianId}')">
                                <i class="fas fa-play"></i> Start Timer
                            </button>
                            <button class="btn btn-secondary" onclick="timeTrackingManager.showManualEntryModal('${requestId}', '${technicianId}')">
                                <i class="fas fa-plus"></i> Add Manual Entry
                            </button>
                        </div>
                    `}

                    <div class="time-entries-list" style="margin-top: 1rem;">
                        ${timeEntries.length === 0 ? `
                            <div class="empty-state" style="padding: 2rem;">
                                <p style="color: var(--text-muted-more);">No time entries yet. Start tracking time for this request.</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 0.5rem;">
                                ${timeEntries.map(entry => this.renderTimeEntryCard(entry, requestId)).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render time entry card
     */
    renderTimeEntryCard(entry, requestId) {
        const isActive = !entry.endTime;
        const duration = entry.duration || (isActive ? Date.now() - new Date(entry.startTime) : 0);

        return `
            <div style="padding: 1rem; background: var(--card-bg-subtle); border-radius: 8px; border-left: 3px solid ${isActive ? '#f59e0b' : '#10b981'};">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span style="font-weight: 600;">${this.formatDuration(duration)}</span>
                            ${isActive ? '<span class="status-badge status-waiting-inspection">Running</span>' : ''}
                            ${entry.manual ? '<span class="status-badge status-received">Manual</span>' : ''}
                        </div>
                        <p style="color: var(--text-muted-more); font-size: 0.875rem;">
                            ${Utils.formatDate(entry.startTime)} - ${entry.endTime ? Utils.formatDate(entry.endTime) : 'Running'}
                        </p>
                        ${entry.notes ? `<p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.25rem;">${entry.notes}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                onclick="timeTrackingManager.showEditNotesModal('${requestId}', '${entry.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" style="padding: 0.375rem 0.75rem; font-size: 0.875rem;" 
                                onclick="timeTrackingManager.deleteTimeEntry('${requestId}', '${entry.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Start timer
     */
    startTimer(requestId, technicianId) {
        const result = this.startTimeTracking(requestId, technicianId);
        if (result.success) {
            toast.success('Timer started!');
            this.refreshTimeTracking(requestId, technicianId);
        } else {
            toast.error(result.message);
        }
    }

    /**
     * Stop timer
     */
    stopTimer(requestId, timeEntryId) {
        const result = this.stopTimeTracking(requestId, timeEntryId);
        if (result.success) {
            toast.success('Timer stopped!');
            this.refreshTimeTracking(requestId, null);
        } else {
            toast.error(result.message);
        }
    }

    /**
     * Refresh time tracking section
     */
    refreshTimeTracking(requestId, technicianId) {
        const timeTrackingSection = document.querySelector('.time-tracking-section');
        if (timeTrackingSection) {
            timeTrackingSection.innerHTML = this.renderTimeTrackingSection(requestId, technicianId);
        }
    }

    /**
     * Show manual entry modal
     */
    showManualEntryModal(requestId, technicianId) {
        const content = `
            <form id="manualTimeEntryForm">
                <div class="form-group">
                    <label class="form-label">Start Time *</label>
                    <input type="datetime-local" class="form-input" name="startTime" required>
                </div>
                <div class="form-group">
                    <label class="form-label">End Time *</label>
                    <input type="datetime-local" class="form-input" name="endTime" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" rows="3" placeholder="What did you work on?"></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-plus"></i> Add Entry
                </button>
            </form>
        `;

        modalManager.create('manual-time-entry', 'Add Manual Time Entry', content);
        modalManager.open('manual-time-entry');

        const form = document.getElementById('manualTimeEntryForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            this.addManualTimeEntry(
                requestId,
                technicianId,
                form.startTime.value,
                form.endTime.value,
                form.notes.value
            );

            modalManager.close('manual-time-entry');
            toast.success('Time entry added!');
            this.refreshTimeTracking(requestId, technicianId);
        });
    }

    /**
     * Show edit notes modal
     */
    showEditNotesModal(requestId, timeEntryId) {
        const timeEntry = this.timeEntries[requestId]?.find(entry => entry.id === timeEntryId);
        if (!timeEntry) return;

        const content = `
            <form id="editNotesForm">
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" name="notes" rows="4">${timeEntry.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">
                    <i class="fas fa-save"></i> Save Notes
                </button>
            </form>
        `;

        modalManager.create('edit-notes', 'Edit Notes', content);
        modalManager.open('edit-notes');

        const form = document.getElementById('editNotesForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            this.updateTimeEntryNotes(requestId, timeEntryId, form.notes.value);
            modalManager.close('edit-notes');
            toast.success('Notes updated!');
            this.refreshTimeTracking(requestId, null);
        });
    }

    /**
     * Get time tracking statistics
     */
    getStatistics() {
        const stats = {
            totalEntries: 0,
            totalTime: 0,
            byTechnician: {},
            byStatus: {
                in_progress: 0,
                completed: 0
            },
            averageTimePerRequest: 0
        };

        const requestCount = Object.keys(this.timeEntries).length;

        for (const requestId in this.timeEntries) {
            const entries = this.timeEntries[requestId];
            
            entries.forEach(entry => {
                stats.totalEntries++;
                
                if (entry.duration) {
                    stats.totalTime += entry.duration;
                }

                if (entry.technicianId) {
                    stats.byTechnician[entry.technicianId] = (stats.byTechnician[entry.technicianId] || 0) + (entry.duration || 0);
                }

                if (entry.status === 'in_progress') {
                    stats.byStatus.in_progress++;
                } else {
                    stats.byStatus.completed++;
                }
            });
        }

        if (requestCount > 0) {
            stats.averageTimePerRequest = stats.totalTime / requestCount;
        }

        return stats;
    }

    /**
     * Render time tracking dashboard
     */
    renderTimeTrackingDashboard() {
        const stats = this.getStatistics();

        return `
            <div class="time-tracking-dashboard">
                <div class="dashboard-header">
                    <h2>Time Tracking Dashboard</h2>
                </div>

                <div class="stats-grid" style="margin-bottom: 2rem;">
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.formatDuration(stats.totalTime)}</h3>
                            <p>Total Time Tracked</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.byStatus.completed}</h3>
                            <p>Completed Entries</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-hourglass-half"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.byStatus.in_progress}</h3>
                            <p>Active Timers</p>
                        </div>
                    </div>
                    <div class="glass-card stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${this.formatDuration(stats.averageTimePerRequest)}</h3>
                            <p>Avg per Request</p>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="padding: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">Time by Technician</h3>
                    <div style="display: grid; gap: 1rem;">
                        ${Object.entries(stats.byTechnician).map(([techId, time]) => {
                            const technician = storage.getUserById(techId);
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--card-bg-subtle); border-radius: 8px;">
                                    <div>
                                        <h4 style="font-weight: 600;">${technician?.name || 'Unknown'}</h4>
                                        <p style="color: var(--text-muted-more); font-size: 0.875rem;">Technician ID: ${techId}</p>
                                    </div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">
                                        ${this.formatDuration(time)}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Create global instance
const timeTrackingManager = new TimeTrackingManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    timeTrackingManager.init();
    
    // Update active timers every second
    setInterval(() => {
        const activeSection = document.querySelector('.time-tracking-section');
        if (activeSection) {
            const requestId = activeSection.querySelector('[data-request-id]')?.dataset.requestId;
            if (requestId) {
                const activeTimer = timeTrackingManager.getActiveTimer(requestId);
                if (activeTimer) {
                    timeTrackingManager.refreshTimeTracking(requestId, null);
                }
            }
        }
    }, 1000);
});
