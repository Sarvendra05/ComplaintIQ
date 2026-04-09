require('dotenv').config();
const db = require('./config/db');
const fs = require('fs');
const path = require('path');
const http = require('http');

async function verify() {
    const complaintId = 23;
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImNpdGl6ZW4iLCJuYW1lIjoiQWFyYXYgTWVodGEiLCJpYXQiOjE3NzUxNTEyNTMsImV4cCI6MTc3NTE1NDg1M30.AfAeqs0jmMJIPPfnG0XyKCZAmdU';

    try {
        console.log('--- Phase 1: Check Pre-conditions ---');
        const [complaints] = await db.query('SELECT image_path, citizen_id FROM complaint WHERE complaint_id = ?', [complaintId]);
        if (complaints.length === 0) {
            console.log('Complaint not found');
            process.exit(1);
        }
        console.log('Complaint ID:', complaintId);
        console.log('Citizen ID:', complaints[0].citizen_id);
        console.log('DB image_path:', complaints[0].image_path);
        
        const fullPath = path.join(__dirname, complaints[0].image_path);
        console.log('File exists on disk:', fs.existsSync(fullPath));

        console.log('\n--- Phase 2: Call DELETE API ---');
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: `/api/complaints/${complaintId}/image`,
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', async () => {
                console.log('API Status:', res.statusCode);
                console.log('API Response Body:', data);

                console.log('\n--- Phase 3: Check Post-conditions ---');
                const [updated] = await db.query('SELECT image_path FROM complaint WHERE complaint_id = ?', [complaintId]);
                console.log('DB image_path (should be NULL):', updated[0].image_path);
                console.log('File still exists on disk (should be false):', fs.existsSync(fullPath));

                if (updated[0].image_path === null && !fs.existsSync(fullPath)) {
                    console.log('\n✅ VERIFICATION SUCCESSFUL!');
                } else {
                    console.log('\n❌ VERIFICATION FAILED! Logic did not execute as expected.');
                }
                process.exit(0);
            });
        });

        req.on('error', (e) => {
            console.error('Error calling API:', e.message);
            process.exit(1);
        });

        req.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verify();
