const mysql = require('mysql2/promise');

const poolConfig = process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')
    ? {
        uri: process.env.DB_HOST,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'complaint_system',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    };

const pool = mysql.createPool(poolConfig);

module.exports = pool;
