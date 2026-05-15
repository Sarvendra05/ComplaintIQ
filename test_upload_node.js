const fs = require('fs');

async function run() {
  const token = 'MOCK';
  
  // Register and login to get real token
  await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Citizen 2',
      email: 'testcitizen2@example.com',
      password: 'password123',
      phone: '1234567890',
      role: 'citizen'
    })
  });
  
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testcitizen2@example.com',
      password: 'password123'
    })
  });
  
  const loginData = await loginRes.json();
  const validToken = loginData.token;
  
  // create dummy image file
  fs.writeFileSync('dummy2.jpg', 'fake image content');
  const buffer = fs.readFileSync('dummy2.jpg');
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  const dummyFile = new File([blob], 'dummy2.jpg', { type: 'image/jpeg' });

  const form = new FormData();
  form.append('title', 'Test Title');
  form.append('description', 'Test Description');
  form.append('category', 'Road');
  form.append('area_id', '1');
  form.append('priority', 'Medium');
  form.append('image', dummyFile);
  
  const compRes = await fetch('http://localhost:3000/api/complaints', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${validToken}`
    },
    body: form
  });
  
  console.log(compRes.status);
  console.log(await compRes.json());
  
  // Check the DB
  const db = require('./config/db');
  const [rows] = await db.query('SELECT complaint_id, title, image_path FROM complaint ORDER BY complaint_id DESC LIMIT 1');
  console.log('DB Result:', rows);
  process.exit(0);
}
run();
