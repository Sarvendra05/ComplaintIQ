require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrateEvent() {
    let connection;
    try {
        const uri = process.env.DB_HOST;
        if (!uri) throw new Error("No DB_HOST found in .env");

        connection = await mysql.createConnection({
            uri: uri,
            multipleStatements: true
        });
        
        console.log('Connected to DB');
        const dbDir = path.join(__dirname, 'database');
        
        let procSQL = fs.readFileSync(path.join(dbDir, 'procedures.sql'), 'utf8');

        // Remove DELIMITER directives and replace // terminators with ;
        procSQL = procSQL
            .replace(/DELIMITER\s+\/\//g, '')
            .replace(/DELIMITER\s+;/g, '')
            .replace(/END\s+\/\//g, 'END;')
            .replace(/END\s*\/\//g, 'END;');

        await connection.query(procSQL);
        console.log('Updated procedures and events successfully.');
    } catch(err) {
        console.error('Migration failed:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrateEvent();
