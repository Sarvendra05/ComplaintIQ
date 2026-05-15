const db = require('./config/db');

async function checkComplaints() {
  try {
    const [rows] = await db.query('SELECT complaint_id, title, image_path FROM complaint ORDER BY complaint_id DESC LIMIT 5');
    console.log(rows);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkComplaints();
