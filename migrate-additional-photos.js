const mysql = require('mysql2/promise');
require('dotenv').config();

const poolConfig = process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')
    ? {
        uri: process.env.DB_HOST,
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'complaint_system',
        waitForConnections: true,
        connectionLimit: 1,
        queueLimit: 0
    };

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(poolConfig);
        console.log('Connected to database for migration.');

        // 1. Create complaint_additional_photo table
        console.log('Creating complaint_additional_photo table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS complaint_additional_photo (
                id INT AUTO_INCREMENT PRIMARY KEY,
                complaint_id INT NOT NULL,
                photo_url VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (complaint_id) REFERENCES complaint(complaint_id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
