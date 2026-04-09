require('dotenv').config();
const db = require('./config/db');
const jwt = require('jsonwebtoken');

async function getToken() {
    try {
        const [rows] = await db.query('SELECT * FROM citizen WHERE email = ?', ['aarav@example.com']);
        if (rows.length === 0) {
            console.log('User not found');
            process.exit(1);
        }
        const user = rows[0];
        const token = jwt.sign(
            { id: user.citizen_id, role: 'citizen', name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(token);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getToken();
