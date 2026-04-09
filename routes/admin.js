const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Admin: Get all complaints with filters
router.get('/complaints', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { area_id, category, status, date_from, date_to, search } = req.query;
        let query = `
            SELECT c.*, a.area_name, d.dept_name, ci.name AS citizen_name
            FROM complaint c
            JOIN area a ON c.area_id = a.area_id
            LEFT JOIN department d ON c.dept_id = d.dept_id
            JOIN citizen ci ON c.citizen_id = ci.citizen_id
            WHERE 1=1
        `;
        const params = [];

        if (area_id) { query += ' AND c.area_id = ?'; params.push(area_id); }
        if (category) { query += ' AND c.category = ?'; params.push(category); }
        if (status) { query += ' AND c.status = ?'; params.push(status); }
        if (date_from) { query += ' AND c.date >= ?'; params.push(date_from); }
        if (date_to) { query += ' AND c.date <= ?'; params.push(date_to); }
        if (search) {
            query += ' AND (c.title LIKE ? OR c.description LIKE ? OR ci.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY c.date DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching complaints.' });
    }
});

// Admin: Assign department to complaint
router.put('/assign', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const { complaint_id, dept_id } = req.body;

        if (!complaint_id || !dept_id) {
            return res.status(400).json({ error: 'complaint_id and dept_id are required.' });
        }

        await db.query('UPDATE complaint SET dept_id = ?, status = "In Progress", assigned_date = CURRENT_TIMESTAMP WHERE complaint_id = ?', [dept_id, complaint_id]);

        res.json({ message: 'Department assigned successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error assigning department.' });
    }
});

// Admin: Dashboard stats
router.get('/stats', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const [total] = await db.query('SELECT COUNT(*) AS count FROM complaint');
        const [pending] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE status = 'Pending'");
        const [inProgress] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE status = 'In Progress'");
        const [resolved] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE status = 'Resolved'");
        const [escalated] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE status = 'Escalated'");
        const [citizens] = await db.query('SELECT COUNT(*) AS count FROM citizen');

        res.json({
            total: total[0].count,
            pending: pending[0].count,
            in_progress: inProgress[0].count,
            resolved: resolved[0].count,
            escalated: escalated[0].count,
            citizens: citizens[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching stats.' });
    }
});

// Admin: Hotspot detection
router.get('/hotspots', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const [hotspotAreas] = await db.query('SELECT * FROM v_hotspot_areas WHERE complaint_count > 0');
        const [categoryFreq] = await db.query('SELECT * FROM v_category_frequency');
        const [monthlyTrend] = await db.query('SELECT * FROM v_monthly_trend');

        res.json({ hotspot_areas: hotspotAreas, category_frequency: categoryFreq, monthly_trend: monthlyTrend });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching hotspot data.' });
    }
});

// Admin: Performance report
router.get('/performance', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const [performance] = await db.query('SELECT * FROM v_dept_performance');
        res.json(performance);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching performance data.' });
    }
});

// Admin: Get all departments
router.get('/departments', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM department ORDER BY dept_name');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching departments.' });
    }
});

module.exports = router;
