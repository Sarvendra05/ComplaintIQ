const db = require('./config/db');

async function check() {
  const [reopens] = await db.query('SELECT * FROM complaint_reopen_log ORDER BY reopen_id DESC LIMIT 5');
  console.log('Reopens:', reopens);

  const [photos] = await db.query('SELECT * FROM complaint_additional_photo ORDER BY photo_id DESC LIMIT 5');
  console.log('Photos:', photos);
  
  process.exit(0);
}
check();
