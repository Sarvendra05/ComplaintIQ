const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register Citizen
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, area, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required.' });
        }

        // Check if email exists
        const [existing] = await db.query('SELECT citizen_id FROM citizen WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO citizen (name, email, phone, area, password) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone || null, area || null, hashedPassword]
        );

        const token = jwt.sign(
            { id: result.insertId, role: 'citizen', name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ message: 'Registration successful', token, role: 'citizen', name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// Login (Citizen / Admin / Department)
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role are required.' });
        }

        let user = null;
        let userId, userName;

        if (role === 'citizen') {
            const [rows] = await db.query('SELECT * FROM citizen WHERE email = ?', [username]);
            if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
            user = rows[0];
            userId = user.citizen_id;
            userName = user.name;
        } else if (role === 'admin') {
            const [rows] = await db.query('SELECT * FROM admin WHERE username = ?', [username]);
            if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
            user = rows[0];
            userId = user.admin_id;
            userName = user.username;
        } else if (role === 'department') {
            const [rows] = await db.query(
                'SELECT do.*, d.dept_name FROM dept_officer do JOIN department d ON do.dept_id = d.dept_id WHERE do.username = ?',
                [username]
            );
            if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
            user = rows[0];
            userId = user.officer_id;
            userName = user.name;
        } else {
            return res.status(400).json({ error: 'Invalid role.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const tokenPayload = { id: userId, role, name: userName };
        if (role === 'department') {
            tokenPayload.dept_id = user.dept_id;
            tokenPayload.dept_name = user.dept_name;
        }

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ message: 'Login successful', token, role, name: userName, ...(role === 'department' && { dept_name: user.dept_name }) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

module.exports = router;
