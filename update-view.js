require('dotenv').config();
const db = require('./config/db');

async function run() {
    // Recreate v_hotspot_areas with lat/lng/district/state/ward
    await db.query('DROP VIEW IF EXISTS v_hotspot_areas');
    await db.query(`
        CREATE VIEW v_hotspot_areas AS
        SELECT
            a.area_id,
            a.area_name,
            a.district,
            a.state,
            a.ward,
            a.latitude,
            a.longitude,
            COUNT(c.complaint_id) AS complaint_count,
            SUM(CASE WHEN c.status IN ('Pending','Escalated') THEN 1 ELSE 0 END) AS unresolved_count
        FROM area a
        LEFT JOIN complaint c ON a.area_id = c.area_id
        GROUP BY a.area_id, a.area_name, a.district, a.state, a.ward, a.latitude, a.longitude
        ORDER BY complaint_count DESC
    `);
    console.log('v_hotspot_areas view updated with geo columns.');
    process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
