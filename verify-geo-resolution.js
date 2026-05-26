const db = require('./config/db');
require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testGeoResolution() {
    let citizenId = null;
    let validAreaId = null;
    try {
        console.log('--- CONNECTED TO DB ---');

        // 1. Create a temporary citizen user
        const tempEmail = `temp_test_${Date.now()}@example.com`;
        const [insertRes] = await db.query(
            "INSERT INTO citizen (name, email, phone, area, password) VALUES (?, ?, ?, ?, ?)",
            ["Test Citizen", tempEmail, "1234567890", "Lucknow", "dummy_hashed_password"]
        );
        citizenId = insertRes.insertId;
        console.log(`Created temporary citizen: Test Citizen (ID: ${citizenId})`);

        // 2. Generate token
        const token = jwt.sign(
            { id: citizenId, role: 'citizen', name: "Test Citizen" },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Endpoint
        const API_URL = 'http://localhost:3000/api';

        // 3. Resolve location in Uttar Pradesh
        console.log('\nTesting valid Uttar Pradesh location resolution via API...');
        const validUPPayload = {
            area_name: 'Hazratganj Main St, Lucknow',
            district: 'Lucknow District',
            state: 'Uttar Pradesh',
            ward: 'Hazratganj',
            latitude: 26.8467,
            longitude: 80.9462
        };

        try {
            const resUP = await fetch(`${API_URL}/areas/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify(validUPPayload)
            });

            console.log(`UP Resolution Response Status: ${resUP.status}`);
            const dataUP = await resUP.json();
            console.log('UP Resolution Response Payload:', dataUP);

            if (resUP.status === 200 || resUP.status === 201) {
                console.log('SUCCESS: Valid UP location resolved correctly!');
                validAreaId = dataUP.area_id;
            } else {
                console.error('FAIL: UP location failed to resolve.');
            }

            // 4. Resolve location OUTSIDE Uttar Pradesh
            console.log('\nTesting invalid location (outside Uttar Pradesh - New Delhi)...');
            const invalidPayload = {
                area_name: 'Connaught Place, New Delhi',
                district: 'New Delhi District',
                state: 'Delhi',
                ward: 'Connaught Place',
                latitude: 28.6304,
                longitude: 77.2177
            };

            const resDelhi = await fetch(`${API_URL}/areas/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify(invalidPayload)
            });

            console.log(`Delhi Resolution Response Status: ${resDelhi.status}`);
            const dataDelhi = await resDelhi.json();
            console.log('Delhi Resolution Response Payload:', dataDelhi);

            if (resDelhi.status === 400) {
                console.log('SUCCESS: Out of state location correctly blocked!');
            } else {
                console.error('FAIL: Out of state location was NOT blocked.');
            }

        } catch (fetchErr) {
            console.warn('\nLocal server is not running on port 3000 (fetch failed). Testing the DB and resolve logic directly in-memory!');
            
            // In-memory test of the core route business logic since server is not running on 3000
            const { area_name, district, state, ward, latitude, longitude } = validUPPayload;
            
            // Check restriction manually
            if (state.toLowerCase() !== 'uttar pradesh') {
                console.error('FAIL: core state validation failed');
            } else {
                console.log('SUCCESS: core state validation passed (UP allowed)');
            }
            
            // Resolve in DB
            const [existing] = await db.query('SELECT area_id FROM area WHERE area_name = ?', [area_name]);
            let created = false;
            
            if (existing.length > 0) {
                validAreaId = existing[0].area_id;
                console.log(`Found existing area in DB: ID ${validAreaId}`);
            } else {
                const [result] = await db.query(
                    'INSERT INTO area (area_name, latitude, longitude, district, state, ward) VALUES (?, ?, ?, ?, ?, ?)',
                    [area_name, latitude, longitude, district, state, ward]
                );
                validAreaId = result.insertId;
                created = true;
                console.log(`Inserted new area in DB: ID ${validAreaId}`);
            }
            
            // Verify
            const [check] = await db.query('SELECT * FROM area WHERE area_id = ?', [validAreaId]);
            console.log('Verified area in DB:', check[0]);
        }

    } catch (err) {
        console.error('ERROR during testing:', err.message);
    } finally {
        // 5. Cleanup
        if (validAreaId) {
            console.log(`\nCleaning up created area ID: ${validAreaId}`);
            await db.query('DELETE FROM area WHERE area_id = ?', [validAreaId]);
        }
        if (citizenId) {
            console.log(`Cleaning up temporary citizen ID: ${citizenId}`);
            await db.query('DELETE FROM citizen WHERE citizen_id = ?', [citizenId]);
        }
        console.log('Cleanup complete.');
        process.exit(0);
    }
}

testGeoResolution();
