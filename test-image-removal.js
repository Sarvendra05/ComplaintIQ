require('dotenv').config();
const db = require('./config/db');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        // Find a citizen
        const [citizens] = await db.query('SELECT citizen_id FROM citizen LIMIT 1');
        if (citizens.length === 0) {
            console.log('No citizens found');
            process.exit(1);
        }
        const citizenId = citizens[0].citizen_id;

        // Find an area
        const [areas] = await db.query('SELECT area_id FROM area LIMIT 1');
        if (areas.length === 0) {
            console.log('No areas found');
            process.exit(1);
        }
        const areaId = areas[0].area_id;

        // Create a dummy image file
        const dummyImagePath = 'uploads/test-image.jpg';
        const fullPath = path.join(__dirname, dummyImagePath);
        if (!fs.existsSync(path.dirname(fullPath))) {
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        }
        fs.writeFileSync(fullPath, 'dummy data');

        // Insert complaint
        const [result] = await db.query(
            'INSERT INTO complaint (citizen_id, area_id, category, title, description, image_path) VALUES (?, ?, ?, ?, ?, ?)',
            [citizenId, areaId, 'Road', 'Test Complaint for Removal', 'Description', '/' + dummyImagePath]
        );

        console.log(`Complaint created with ID: ${result.insertId}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
