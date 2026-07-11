const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a backup of a specific table
 * @param {string} tableName - Name of the table to backup
 * @returns {object} - Backup result
 */
async function backupTable(tableName) {
    try {
        console.log(`Starting backup for table: ${tableName}`);
        
        const { data, error } = await supabase
            .from(tableName)
            .select('*');

        if (error) {
            console.error(`Error backing up table ${tableName}:`, error);
            return { success: false, error };
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${tableName}_${timestamp}.json`;
        const filepath = path.join(BACKUP_DIR, filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        console.log(`Backup created: ${filename}`);
        return { success: true, filename, recordCount: data.length };
    } catch (error) {
        console.error(`Unexpected error backing up table ${tableName}:`, error);
        return { success: false, error };
    }
}

/**
 * Create a backup of all tables
 * @returns {object} - Backup result
 */
async function backupAllTables() {
    try {
        console.log('Starting full database backup...');
        
        const tables = ['requests', 'users', 'orders', 'technicians', 'inventory'];
        const results = [];

        for (const table of tables) {
            const result = await backupTable(table);
            results.push({ table, ...result });
        }

        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`Backup complete: ${successful} successful, ${failed} failed`);
        
        return { success: true, results, successful, failed };
    } catch (error) {
        console.error('Unexpected error during full backup:', error);
        return { success: false, error };
    }
}

/**
 * Restore a table from backup
 * @param {string} tableName - Name of the table to restore
 * @param {string} filename - Backup filename
 * @returns {object} - Restore result
 */
async function restoreTable(tableName, filename) {
    try {
        console.log(`Starting restore for table: ${tableName} from ${filename}`);
        
        const filepath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(filepath)) {
            return { success: false, error: 'Backup file not found' };
        }

        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

        // Clear existing data
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .neq('id', 0); // Delete all records

        if (deleteError) {
            console.error(`Error clearing table ${tableName}:`, deleteError);
            return { success: false, error: deleteError };
        }

        // Insert backup data
        const { error: insertError } = await supabase
            .from(tableName)
            .insert(data);

        if (insertError) {
            console.error(`Error inserting data into table ${tableName}:`, insertError);
            return { success: false, error: insertError };
        }

        console.log(`Restore complete: ${data.length} records restored`);
        return { success: true, recordCount: data.length };
    } catch (error) {
        console.error(`Unexpected error restoring table ${tableName}:`, error);
        return { success: false, error };
    }
}

/**
 * List all available backups
 * @returns {array} - List of backup files
 */
function listBackups() {
    try {
        const files = fs.readdirSync(BACKUP_DIR);
        return files.filter(file => file.endsWith('.json'));
    } catch (error) {
        console.error('Error listing backups:', error);
        return [];
    }
}

/**
 * Delete old backups (older than specified days)
 * @param {number} days - Number of days to keep
 * @returns {object} - Cleanup result
 */
function cleanupOldBackups(days = 30) {
    try {
        const files = listBackups();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        let deletedCount = 0;

        files.forEach(file => {
            const filepath = path.join(BACKUP_DIR, file);
            const stats = fs.statSync(filepath);
            
            if (stats.mtime < cutoffDate) {
                fs.unlinkSync(filepath);
                deletedCount++;
                console.log(`Deleted old backup: ${file}`);
            }
        });

        console.log(`Cleanup complete: ${deletedCount} old backups deleted`);
        return { success: true, deletedCount };
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
        return { success: false, error };
    }
}

/**
 * Schedule automatic backups
 * @param {number} intervalHours - Interval in hours between backups
 */
function scheduleAutomaticBackups(intervalHours = 24) {
    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`Scheduling automatic backups every ${intervalHours} hours`);
    
    setInterval(async () => {
        console.log('Running scheduled backup...');
        await backupAllTables();
        await cleanupOldBackups(30); // Keep backups for 30 days
    }, intervalMs);

    // Run initial backup
    backupAllTables();
}

/**
 * Export backup to external storage (e.g., S3, Google Drive)
 * @param {string} filename - Backup filename
 * @param {string} destination - Destination path
 * @returns {object} - Export result
 */
async function exportBackup(filename, destination) {
    try {
        const filepath = path.join(BACKUP_DIR, filename);
        
        if (!fs.existsSync(filepath)) {
            return { success: false, error: 'Backup file not found' };
        }

        // This is a placeholder for external storage integration
        // You would integrate with AWS S3, Google Cloud Storage, etc.
        console.log(`Exporting backup ${filename} to ${destination}`);
        
        return { success: true, message: 'Export functionality requires external storage integration' };
    } catch (error) {
        console.error('Error exporting backup:', error);
        return { success: false, error };
    }
}

module.exports = {
    backupTable,
    backupAllTables,
    restoreTable,
    listBackups,
    cleanupOldBackups,
    scheduleAutomaticBackups,
    exportBackup
};
