const db = require('./config/db');

async function patchDB() {
    try {
        console.log('Patching DB schema safely...');
        
        // Add reopen_count if not exists
        try {
            await db.query('ALTER TABLE complaint ADD COLUMN reopen_count INT DEFAULT 0');
            console.log('Added reopen_count column to complaint table.');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('reopen_count already exists.');
            } else {
                console.error('Error adding reopen_count:', e.message);
            }
        }
        
        // Create audit log table
        await db.query(`
            CREATE TABLE IF NOT EXISTS audit_log (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                action VARCHAR(255) NOT NULL,
                action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('audit_log table verified/created.');
        
        // Create reopen log
        await db.query(`
            CREATE TABLE IF NOT EXISTS complaint_reopen_log (
                log_id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                reason TEXT NOT NULL,
                image_path VARCHAR(255) DEFAULT NULL,
                reopened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('complaint_reopen_log table verified/created.');

        // Create additional photo log
        await db.query(`
            CREATE TABLE IF NOT EXISTS complaint_additional_photo (
                photo_id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                image_path VARCHAR(255) NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                uploaded_by_role ENUM('citizen', 'department', 'admin') NOT NULL,
                FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('complaint_additional_photo table verified/created.');

        console.log('Patching complete!');
        process.exit(0);
    } catch(err) {
        console.error('Fatal error patching db:', err);
        process.exit(1);
    }
}

patchDB();
