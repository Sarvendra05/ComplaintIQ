const jwt = require('jsonwebtoken');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

async function run() {
  const token = jwt.sign({ id: 1, role: 'citizen' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
  
  fs.writeFileSync('dummy3.jpg', 'fake image content');
  
  const form = new FormData();
  form.append('title', 'Test Title');
  form.append('description', 'Test Description');
  form.append('category', 'Road');
  form.append('area_id', '1');
  form.append('priority', 'Medium');
  form.append('image', fs.createReadStream('dummy3.jpg'));
  
  const compRes = await fetch('http://localhost:3000/api/complaints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });
  
  console.log(compRes.status);
  console.log(await compRes.json());
  
  const db = require('./config/db');
  const [rows] = await db.query('SELECT complaint_id, title, image_path FROM complaint ORDER BY complaint_id DESC LIMIT 1');
  console.log('DB Result:', rows);
  process.exit(0);
}
run();
