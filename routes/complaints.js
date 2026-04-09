const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetypes = /image\/jpeg|image\/jpg|image\/png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: Images Only (JPG, JPEG, PNG)!"));
    }
});

// Create a new complaint
router.post('/', authenticateToken, authorizeRole('citizen'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size too large. Max 2MB allowed.' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { title, description, category, area_id, priority } = req.body;

        const image_path = req.file ? `/uploads/${req.file.filename}` : null;

        if (!title || !description || !category || !area_id) {
            return res.status(400).json({ error: 'Title, description, category, and area are required.' });
        }

        const [result] = await db.query(
            'INSERT INTO complaint (citizen_id, area_id, category, title, description, priority, image_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, area_id, category, title, description, priority || 'Medium', image_path]
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

        // Get reopen history
        const [reopens] = await db.query(
            'SELECT * FROM complaint_reopen_log WHERE complaint_id = ? ORDER BY reopened_at DESC',
            [req.params.id]
        );

        // Get additional photos
        const [additionalPhotos] = await db.query(
            'SELECT * FROM complaint_additional_photo WHERE complaint_id = ? ORDER BY uploaded_at ASC',
            [req.params.id]
        );

        res.json({ 
            ...rows[0], 
            audit_log: logs, 
            reopen_history: reopens,
            additional_photos: additionalPhotos 
        });
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

// Edit complaint (Citizen only, before assignment)
router.put('/:id', authenticateToken, authorizeRole('citizen'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size too large. Max 2MB allowed.' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const complaintId = req.params.id;
        const citizenId = req.user.id;
        const { title, description, category, area_id } = req.body;

        // 1. Check ownership and status
        const [complaints] = await db.query(
            'SELECT * FROM complaint WHERE complaint_id = ? AND citizen_id = ?',
            [complaintId, citizenId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ error: 'Complaint not found or unauthorized.' });
        }

        const complaint = complaints[0];
        
        // 1.5. Check if resolved or closed
        if (complaint.status === 'Resolved' || complaint.status === 'Closed') {
            return res.status(403).json({ error: 'Modification not allowed after complaint resolution.' });
        }

        // 1.6. Check if original proof immutability applies
        if (complaint.reopen_count > 0 && req.file) {
            return res.status(403).json({ error: 'Original proof is immutable. You can only add new supporting evidence.' });
        }

        // 2. Check if assigned
        if (complaint.dept_id !== null && complaint.reopen_count === 0) {
            return res.status(400).json({ error: 'You cannot edit this complaint after assignment' });
        }

        let imagePath = complaint.image_path;

        // 3. Handle image replacement
        if (req.file) {
            // Delete old image if it exists
            if (imagePath) {
                const oldPath = path.join(__dirname, '..', imagePath);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            imagePath = `/uploads/${req.file.filename}`;
        }

        // 4. Update complaint
        await db.query(
            `UPDATE complaint 
             SET title = ?, description = ?, category = ?, area_id = ?, image_path = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE complaint_id = ?`,
            [title || complaint.title, description || complaint.description, category || complaint.category, area_id || complaint.area_id, imagePath, complaintId]
        );

        // 5. Log the action
        await db.query(
            'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
            [complaintId, 'Complaint updated by citizen']
        );

        res.json({ message: 'Complaint updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while updating complaint.' });
    }
});

// Delete complaint image (Citizen only)
router.delete('/:id/image', authenticateToken, authorizeRole('citizen'), async (req, res) => {
    try {
        const complaintId = req.params.id;
        const citizenId = req.user.id;

        // Check if the complaint exists and belongs to the citizen
        const [complaints] = await db.query(
            'SELECT image_path, status, reopen_count FROM complaint WHERE complaint_id = ? AND citizen_id = ?',
            [complaintId, citizenId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ error: 'Complaint not found or unauthorized.' });
        }

        const complaint = complaints[0];
        const imagePath = complaint.image_path;
        const { status, reopen_count } = complaint;

        if (status === 'Resolved' || status === 'Closed' || reopen_count > 0) {
            return res.status(403).json({ error: 'Original proof is permanent and cannot be modified or deleted.' });
        }

        if (!imagePath) {
            return res.status(400).json({ error: 'No image found for this complaint.' });
        }

        // Delete file from storage
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Update database
        await db.query(
            'UPDATE complaint SET image_path = NULL WHERE complaint_id = ?',
            [complaintId]
        );

        // Log the action
        await db.query(
            'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
            [complaintId, 'Image removed']
        );

        res.json({ message: 'Image removed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while removing image.' });
    }
});

// Reopen complaint (Citizen only, controlled)
router.post('/:id/reopen', authenticateToken, authorizeRole('citizen'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size too large. Max 2MB allowed.' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const complaintId = req.params.id;
        const citizenId = req.user.id;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Reason is required to reopen a complaint.' });
        }

        // Check ownership, status, and reopen_count
        const [complaints] = await db.query(
            'SELECT status, reopen_count FROM complaint WHERE complaint_id = ? AND citizen_id = ?',
            [complaintId, citizenId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ error: 'Complaint not found or unauthorized.' });
        }

        const { status, reopen_count } = complaints[0];
        
        if (status !== 'Resolved' && status !== 'Closed') {
            return res.status(400).json({ error: 'Only resolved or closed complaints can be reopened.' });
        }

        if (reopen_count >= 2) {
            return res.status(403).json({ error: 'Reopen limit reached. Please create a new complaint.' });
        }

        const newImagePath = req.file ? `/uploads/${req.file.filename}` : null;

        // Update status and increment reopen_count
        await db.query(
            'UPDATE complaint SET status = "In Progress", reopen_count = reopen_count + 1, resolved_date = NULL, updated_at = CURRENT_TIMESTAMP WHERE complaint_id = ?',
            [complaintId]
        );

        // Insert into reopen log
        await db.query(
            'INSERT INTO complaint_reopen_log (complaint_id, reason, image_path) VALUES (?, ?, ?)',
            [complaintId, reason, newImagePath]
        );

        // Log the action in audit_log
        await db.query(
            'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
            [complaintId, `Complaint reopened by citizen. Reason: ${reason}`]
        );

        res.json({ message: 'Complaint reopened successfully. Status updated to In Progress.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while reopening complaint.' });
    }
});

// Add supplementary proof (Citizen only)
router.post('/:id/add-proof', authenticateToken, authorizeRole('citizen'), (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size too large. Max 2MB allowed.' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const complaintId = req.params.id;
        const citizenId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded.' });
        }

        // Check ownership and status
        const [complaints] = await db.query(
            'SELECT status FROM complaint WHERE complaint_id = ? AND citizen_id = ?',
            [complaintId, citizenId]
        );

        if (complaints.length === 0) {
            return res.status(404).json({ error: 'Complaint not found or unauthorized.' });
        }

        if (complaints[0].status !== 'In Progress') {
            return res.status(400).json({ error: 'Supplementary evidence can only be added when the complaint is In Progress.' });
        }

        const photoUrl = `/uploads/${req.file.filename}`;

        // Insert into additional photos table
        await db.query(
            'INSERT INTO complaint_additional_photo (complaint_id, photo_url) VALUES (?, ?)',
            [complaintId, photoUrl]
        );

        // Log the action
        await db.query(
            'INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)',
            [complaintId, 'Additional proof uploaded by citizen']
        );

        res.json({ message: 'Additional proof uploaded successfully.', photo_url: photoUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error while adding proof.' });
    }
});

module.exports = router;
