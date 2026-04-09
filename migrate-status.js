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

        // Update the ENUM
        console.log('Updating status ENUM in complaint table...');
        await connection.query(`
            ALTER TABLE complaint 
            MODIFY COLUMN status ENUM('Pending', 'In Progress', 'Resolved', 'Escalated', 'Closed') DEFAULT 'Pending'
        `);
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
