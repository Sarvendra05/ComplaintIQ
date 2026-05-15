const db = require('./config/db');

async function updateDb() {
  await db.query('UPDATE complaint SET image_path = ? WHERE complaint_id = 28', ['/uploads/complaint-1778782096777-549846337.jpg']);
  console.log('Updated');
  process.exit(0);
}
updateDb();
