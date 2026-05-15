const db = require('./config/db');

async function checkRecentComplaints() {
  const [rows] = await db.query('SELECT complaint_id, title, image_path, date FROM complaint ORDER BY complaint_id DESC LIMIT 10');
  console.log(rows);
  process.exit(0);
}

checkRecentComplaints();
