const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Create a new complaint
router.post('/', authenticateToken, authorizeRole('citizen'), async (req, res) => {
    try {
        const { title, description, category, area_id, priority } = req.body;

        if (!title || !description || !category || !area_id) {
            return res.status(400).json({ error: 'Title, description, category, and area are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO complaint (citizen_id, area_id, category, title, description, priority) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, area_id, category, title, description, priority || 'Medium']
        );

        // Log the creation
        await db.query(
            'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
            [result.insertId, 'Complaint created']
        );

        res.status(201).json({ message: 'Complaint registered successfully', complaint_id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while registering complaint.' });
    }
});

// Get current citizen's complaints
router.get('/mine', authenticateToken, authorizeRole('citizen'), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, a.area_name, d.dept_name 
            FROM complaint c
            JOIN area a ON c.area_id = a.area_id
            LEFT JOIN department d ON c.dept_id = d.dept_id
            WHERE c.citizen_id = ?
            ORDER BY c.date DESC
        `, [req.user.id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching complaints.' });
    }
});

// Get single complaint by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, a.area_name, d.dept_name, ci.name AS citizen_name
            FROM complaint c
            JOIN area a ON c.area_id = a.area_id
            LEFT JOIN department d ON c.dept_id = d.dept_id
            JOIN citizen ci ON c.citizen_id = ci.citizen_id
            WHERE c.complaint_id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        // Get audit log
        const [logs] = await db.query(
            'SELECT * FROM audit_log WHERE complaint_id = ? ORDER BY action_date DESC',
            [req.params.id]
        );

        res.json({ ...rows[0], audit_log: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching complaint.' });
    }
});

// Search complaints
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search, category, status, area_id } = req.query;
        let query = `
            SELECT c.*, a.area_name, d.dept_name 
            FROM complaint c
            JOIN area a ON c.area_id = a.area_id
            LEFT JOIN department d ON c.dept_id = d.dept_id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category) {
            query += ' AND c.category = ?';
            params.push(category);
        }
        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }
        if (area_id) {
            query += ' AND c.area_id = ?';
            params.push(area_id);
        }

        query += ' ORDER BY c.date DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error searching complaints.' });
    }
});

module.exports = router;
