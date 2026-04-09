const mysql = require('mysql2/promise');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const API_URL = 'http://localhost:3000/api';

const poolConfig = process.env.DB_HOST && process.env.DB_HOST.startsWith('mysql://')
    ? { uri: process.env.DB_HOST }
    : {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'complaint_system'
    };

async function test() {
    let connection;
    try {
        connection = await mysql.createConnection(poolConfig);
        console.log('Connected to DB');

        // 1. Get a citizen user
        const [users] = await connection.query('SELECT * FROM citizen LIMIT 1');
        if (users.length === 0) throw new Error('No citizen found in DB');
        const user = users[0];
        
        // 2. Generate token
        const token = jwt.sign(
            { id: user.citizen_id, role: 'citizen', name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 3. Create a test complaint DIRECTLY in DB to avoid multipart/form-data issues
        console.log('Creating test complaint directly in DB...');
        const [areas] = await connection.query('SELECT * FROM area LIMIT 1');
        const areaId = areas[0].area_id;
        
        const [result] = await connection.query(
            'INSERT INTO complaint (citizen_id, area_id, category, title, description, priority, status, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user.citizen_id, areaId, 'Road', 'Test Restriction', 'Testing resolved status locks', 'Low', 'Pending', '/uploads/test.jpg']
        );
        const complaintId = result.insertId;
        console.log(`Created complaint ID: ${complaintId}`);

        // 4. Update status to Resolved in DB
        console.log('Setting status to Resolved...');
        await connection.query('UPDATE complaint SET status = "Resolved" WHERE complaint_id = ?', [complaintId]);

        // 5. Try to Edit (should fail 403)
        console.log('Attempting to edit resolved complaint (expecting 403)...');
        const editRes = await fetch(`${API_URL}/complaints/${complaintId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ title: 'Malicious Update' })
        });
        
        if (editRes.status === 403) {
            const data = await editRes.json();
            console.log('SUCCESS: Edit blocked with 403:', data.error || data.message);
        } else {
            console.error('FAIL: Edit returned unexpected status:', editRes.status);
            if (editRes.status !== 403) {
                const text = await editRes.text();
                console.log('Response body:', text);
            }
        }

        // 6. Try to Remove Image (should fail 403)
        console.log('Attempting to remove photo from resolved complaint (expecting 403)...');
        const removeRes = await fetch(`${API_URL}/complaints/${complaintId}/image`, {
            method: 'DELETE',
            headers
        });
        
        if (removeRes.status === 403) {
            const data = await removeRes.json();
            console.log('SUCCESS: Removal blocked with 403:', data.error || data.message);
        } else {
            console.error('FAIL: Removal returned unexpected status:', removeRes.status);
        }

        // 7. Reopen complaint
        console.log('Reopening complaint...');
        const reopenRes = await fetch(`${API_URL}/complaints/${complaintId}/reopen`, {
            method: 'POST',
            headers
        });
        const reopenData = await reopenRes.json();
        console.log('Reopen response:', reopenData.message);

        // 8. Verify status is now In Progress
        const [check] = await connection.query('SELECT status FROM complaint WHERE complaint_id = ?', [complaintId]);
        console.log('Current status:', check[0].status);
        if (check[0].status === 'In Progress') {
            console.log('SUCCESS: Complaint status updated to In Progress');
        } else {
            console.error('FAIL: Status not updated correctly');
        }

        // 9. Try to Remove Image now (should work)
         console.log('Attempting to remove photo after reopening (expecting 200)...');
         const finalRemove = await fetch(`${API_URL}/complaints/${complaintId}/image`, {
             method: 'DELETE',
             headers
         });
         const finalData = await finalRemove.json();
         console.log('SUCCESS:', finalData.message);

        // Cleanup
        await connection.query('DELETE FROM audit_log WHERE complaint_id = ?', [complaintId]);
        await connection.query('DELETE FROM complaint WHERE complaint_id = ?', [complaintId]);
        console.log('Cleanup done');

    } catch (err) {
        console.error('ERROR during testing:', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

test();
