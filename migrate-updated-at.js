const mysql = require('mysql2/promise');
require('dotenv').config();

const baseConfig = process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')
    ? { uri: process.env.DB_HOST }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    };

async function migrate() {
    let connection;
    try {
        console.log('Connecting to MySQL...');
        connection = await mysql.createConnection({
            ...baseConfig,
            database: process.env.DB_NAME || 'complaint_system'
        });
        console.log('Connected.');

        console.log('Checking if `updated_at` column exists...');
        const [columns] = await connection.query('SHOW COLUMNS FROM complaint LIKE "updated_at"');

        if (columns.length === 0) {
            console.log('Adding `updated_at` column to `complaint` table...');
            await connection.query('ALTER TABLE complaint ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER date');
            console.log('Success!');
        } else {
            console.log('Column `updated_at` already exists.');
        }

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
