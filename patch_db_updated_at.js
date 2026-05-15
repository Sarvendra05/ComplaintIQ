const db = require('./config/db');

async function patchUpdatedAt() {
    try {
        console.log('Patching DB: Adding updated_at to complaint...');
        
        try {
            await db.query('ALTER TABLE complaint ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
            console.log('Added updated_at column to complaint table.');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('updated_at already exists.');
            } else {
                console.error('Error adding updated_at:', e.message);
            }
        }
        
        console.log('Patching complete!');
        process.exit(0);
    } catch(err) {
        console.error('Fatal error patching db:', err);
        process.exit(1);
    }
}

patchUpdatedAt();
