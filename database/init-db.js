/**
 * Database Initialization Script
 * Runs schema.sql, seed.sql, and procedures.sql against MySQL
 * Usage: node database/init-db.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const baseConfig = process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')
    ? { uri: process.env.DB_HOST }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    };

const DB_CONFIG = {
    ...baseConfig,
    multipleStatements: true
};

async function runSQLFile(connection, filePath, label) {
    console.log(`\n▶ Running ${label}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
        await connection.query(sql);
        console.log(`  ✔ ${label} executed successfully.`);
    } catch (err) {
        console.error(`  ✖ Error in ${label}:`, err.message);
        throw err;
    }
}

async function init() {
    let connection;
    try {
        console.log('════════════════════════════════════════════');
        console.log(' Complaint System - Database Initialization');
        console.log('════════════════════════════════════════════');
        console.log(`\nConnecting to MySQL at ${DB_CONFIG.host}...`);

        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✔ Connected to MySQL.\n');

        // Enable Event Scheduler
        await connection.query('SET GLOBAL event_scheduler = ON;');
        console.log('✔ Event scheduler enabled.');

        const dbDir = path.join(__dirname);

        // 1. Schema — creates the database and all tables
        await runSQLFile(connection, path.join(dbDir, 'schema.sql'), 'schema.sql');

        // 2. Seed data
        await runSQLFile(connection, path.join(dbDir, 'seed.sql'), 'seed.sql');

        // 3. Procedures, views, triggers, and events
        // DELIMITER statements are not supported via the JS client,
        // so we need to handle them specially.
        console.log('\n▶ Running procedures.sql...');
        let procSQL = fs.readFileSync(path.join(dbDir, 'procedures.sql'), 'utf8');

        // Remove DELIMITER directives and replace // terminators with ;
        procSQL = procSQL
            .replace(/DELIMITER\s+\/\//g, '')
            .replace(/DELIMITER\s+;/g, '')
            .replace(/END\s+\/\//g, 'END;')
            .replace(/END\s*\/\//g, 'END;');

        await connection.query(procSQL);
        console.log('  ✔ procedures.sql executed successfully.');

        console.log('\n════════════════════════════════════════════');
        console.log(' ✔ Database initialized successfully!');
        console.log('════════════════════════════════════════════');
        console.log('\nDefault credentials:');
        console.log('  Admin    → username: admin      | password: admin123');
        console.log('  Officers → username: *_officer   | password: officer123');
        console.log('  Citizens → email: aarav/diya/... | password: citizen123\n');

    } catch (err) {
        console.error('\n✖ Database initialization failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Connection closed.');
        }
    }
}

init();
