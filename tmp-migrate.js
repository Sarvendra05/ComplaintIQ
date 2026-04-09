require('dotenv').config();
const mysql = require('mysql2/promise');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'complaint_system'
};

async function migrate() {
    let connection;
    try {
        if (process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')) {
            connection = await mysql.createConnection(process.env.DB_HOST);
        } else {
            connection = await mysql.createConnection(DB_CONFIG);
        }
        
        console.log('Connected to DB');
        
        // Add assigned_date if it does not exist
        try {
            await connection.query('ALTER TABLE complaint ADD COLUMN assigned_date DATETIME DEFAULT NULL');
            console.log('Added assigned_date column to complaint table');
        } catch(e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('Column assigned_date already exists.');
            } else {
                throw e;
            }
        }

        // Enable event scheduler
        await connection.query('SET GLOBAL event_scheduler = ON');
        console.log('Enabled global event scheduler.');

        console.log('Migration complete.');
    } catch(err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
