const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Login
  await page.goto('http://localhost:3000/login.html');
  await page.type('#username', 'testcitizen@example.com');
  await page.type('#password', 'password123');
  await page.click('#loginBtn');
  await page.waitForNavigation();

  // Create a file to upload
  const fs = require('fs');
  fs.writeFileSync('dummy_browser.jpg', 'fake image content');

  // Go to complaint form
  await page.goto('http://localhost:3000/complaint-form.html');
  
  await page.type('#title', 'Browser Test');
  await page.select('#category', 'Road');
  await page.select('#priority', 'Medium');
  
  // Wait for areas to load and select one
  await page.waitForSelector('#area_id option:not([value=""])');
  await page.select('#area_id', '1');
  
  await page.type('#description', 'Browser Test Description');
  
  // Upload file
  const inputUploadHandle = await page.$('#image');
  await inputUploadHandle.uploadFile('dummy_browser.jpg');
  
  // Submit
  await page.click('#submitBtn');
  
  // Wait for either success navigation or error toast
  await new Promise(r => setTimeout(r, 2000));
  
  // Check db
  const db = require('./config/db');
  const [rows] = await db.query('SELECT complaint_id, title, image_path FROM complaint ORDER BY complaint_id DESC LIMIT 1');
  console.log('DB Result:', rows);
  
  await browser.close();
  process.exit(0);
})();
