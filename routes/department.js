const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Department: Get assigned complaints
router.get('/complaints', authenticateToken, authorizeRole('department'), async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT c.*, a.area_name, ci.name AS citizen_name
            FROM complaint c
            JOIN area a ON c.area_id = a.area_id
            JOIN citizen ci ON c.citizen_id = ci.citizen_id
            WHERE c.dept_id = ?
        `;
        const params = [req.user.dept_id];

        if (status) {
            query += ' AND c.status = ?';
            params.push(status);
        }

        query += ' ORDER BY c.date DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching department complaints.' });
    }
});

// Department: Update complaint status
router.put('/update-status', authenticateToken, authorizeRole('department'), async (req, res) => {
    try {
        const { complaint_id, status, resolution_note } = req.body;

        if (!complaint_id || !status) {
            return res.status(400).json({ error: 'complaint_id and status are required.' });
        }

        // Verify complaint belongs to this department
        const [check] = await db.query(
            'SELECT * FROM complaint WHERE complaint_id = ? AND dept_id = ?',
            [complaint_id, req.user.dept_id]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Complaint not assigned to your department.' });
        }

        let updateQuery = 'UPDATE complaint SET status = ?';
        const params = [status];

        if (status === 'Resolved') {
            updateQuery += ', resolved_date = NOW()';
        }
        updateQuery += ' WHERE complaint_id = ?';
        params.push(complaint_id);

        await db.query(updateQuery, params);

        // Log resolution note if provided
        if (resolution_note) {
            await db.query(
                'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
                [complaint_id, `Resolution note: ${resolution_note}`]
            );
        }

        res.json({ message: 'Status updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error updating status.' });
    }
});

// Department: Get stats for this department
router.get('/stats', authenticateToken, authorizeRole('department'), async (req, res) => {
    try {
        const deptId = req.user.dept_id;
        const [total] = await db.query('SELECT COUNT(*) AS count FROM complaint WHERE dept_id = ?', [deptId]);
        const [pending] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE dept_id = ? AND status = 'Pending'", [deptId]);
        const [inProgress] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE dept_id = ? AND status = 'In Progress'", [deptId]);
        const [resolved] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE dept_id = ? AND status = 'Resolved'", [deptId]);
        const [escalated] = await db.query("SELECT COUNT(*) AS count FROM complaint WHERE dept_id = ? AND status = 'Escalated'", [deptId]);

        res.json({
            total: total[0].count,
            pending: pending[0].count,
            in_progress: inProgress[0].count,
            resolved: resolved[0].count,
            escalated: escalated[0].count
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching department stats.' });
    }
});

module.exports = router;
