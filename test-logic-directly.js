require('dotenv').config();
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function testLogic() {
    const complaintId = 23;
    try {
        console.log('--- Phase 1: Check Pre-conditions ---');
        const [complaints] = await db.query('SELECT image_path FROM complaint WHERE complaint_id = ?', [complaintId]);
        if (complaints.length === 0) {
            console.log('Complaint not found');
            process.exit(1);
        }
        const imagePath = complaints[0].image_path;
        console.log('DB image_path:', imagePath);
        
        const fullPath = path.join(__dirname, imagePath.startsWith('/') ? imagePath.substring(1) : imagePath);
        console.log('Target fullPath:', fullPath);
        console.log('File exists on disk:', fs.existsSync(fullPath));

        if (!fs.existsSync(fullPath)) {
            console.log('Internal error: File not found for test');
        }

        console.log('\n--- Phase 2: Run Deletion Logic ---');
        // Logic from routes/complaints.js (slightly adapted for path)
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('File deleted from disk');
        }

        await db.query('UPDATE complaint SET image_path = NULL WHERE complaint_id = ?', [complaintId]);
        console.log('Database updated (image_path = NULL)');

        await db.query('INSERT INTO audit_log (complaint_id, action) VALUES (?, ?)', [complaintId, 'Image removed (test-logic)']);
        console.log('Audit log entry created');

        console.log('\n--- Phase 3: Check Post-conditions ---');
        const [updated] = await db.query('SELECT image_path FROM complaint WHERE complaint_id = ?', [complaintId]);
        console.log('DB image_path (should be NULL):', updated[0].image_path);
        console.log('File still exists on disk (should be false):', fs.existsSync(fullPath));

        if (updated[0].image_path === null && !fs.existsSync(fullPath)) {
            console.log('\n✅ LOGIC VERIFICATION SUCCESSFUL!');
        } else {
            console.log('\n❌ LOGIC VERIFICATION FAILED!');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testLogic();
