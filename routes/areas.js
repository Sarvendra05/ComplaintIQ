const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all areas (public for registration & complaint forms)
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM area ORDER BY area_name');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching areas.' });
    }
});

module.exports = router;
