const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

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

// Get all areas with coordinates for map (public)
router.get('/map', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.area_id, a.area_name, a.district, a.state, a.ward,
                    a.latitude, a.longitude,
                    COUNT(c.complaint_id) AS complaint_count
             FROM area a
             LEFT JOIN complaint c ON a.area_id = c.area_id
             WHERE a.latitude IS NOT NULL AND a.longitude IS NOT NULL
             GROUP BY a.area_id
             ORDER BY complaint_count DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching area map data.' });
    }
});

// Find or create area with geo data (citizen must be authenticated)
// Body: { area_name, district, state, ward, latitude, longitude }
router.post('/resolve', authenticateToken, async (req, res) => {
    try {
        const { area_name, district, state, ward, latitude, longitude } = req.body;

        if (!area_name || !latitude || !longitude || !state) {
            return res.status(400).json({ error: 'area_name, latitude, longitude, and state are required.' });
        }

        // Only allow Uttar Pradesh
        if (state.toLowerCase() !== 'uttar pradesh') {
            return res.status(400).json({ error: 'Only locations within Uttar Pradesh are allowed.' });
        }

        // Try to find an existing area by name (exact match)
        const [existing] = await db.query(
            'SELECT area_id FROM area WHERE area_name = ?',
            [area_name]
        );

        if (existing.length > 0) {
            // Update coordinates/geo data in case they are null
            await db.query(
                `UPDATE area SET
                    latitude    = COALESCE(latitude, ?),
                    longitude   = COALESCE(longitude, ?),
                    district    = COALESCE(district, ?),
                    state       = COALESCE(state, ?),
                    ward        = COALESCE(ward, ?)
                 WHERE area_id = ?`,
                [latitude, longitude, district || null, state, ward || null, existing[0].area_id]
            );
            return res.json({ area_id: existing[0].area_id, created: false });
        }

        // Insert new area
        const [result] = await db.query(
            'INSERT INTO area (area_name, latitude, longitude, district, state, ward) VALUES (?, ?, ?, ?, ?, ?)',
            [area_name, latitude, longitude, district || null, state, ward || null]
        );

        res.status(201).json({ area_id: result.insertId, created: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error resolving area.' });
    }
});

module.exports = router;
