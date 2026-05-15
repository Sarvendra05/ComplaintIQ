const db = require('./config/db');

async function run() {
  const [rows] = await db.query('DESCRIBE complaint');
  console.log(rows);
  process.exit(0);
}
run();
