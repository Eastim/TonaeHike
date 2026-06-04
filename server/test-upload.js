const fs = require('fs');
const path = require('path');
const http = require('http');

const postId = 'c752df0d-a3be-4e8b-b912-50e01db1f5c0';
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxY2IyMjc2YS1kMWQwLTQ4MWYtYWM0Yi02ZGZlNTY4YmZhODQiLCJpYXQiOjE3ODA0NjQ0MzUsImV4cCI6MTc4MDQ3MTYzNX0.sgCxHbBAPFfmFawdaQEHkHhOvROT4C0cxL36magBk0Q';

const imagePath = path.join(__dirname, 'public', 'avatar', '1cb2276a-d1d0-481f-ac4b-6dfe568bfa84_1780458813877.png');
const imageBuffer = fs.readFileSync(imagePath);

const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
const filename = 'test-image.png';

const body = `--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n${imageBuffer.toString('binary')}\r\n--${boundary}--\r\n`;

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/posts/${postId}/images`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(body, 'binary')
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Response:', data);
    const postDir = path.join(__dirname, 'public', 'posts', postId);
    fs.readdir(postDir, (err, files) => {
      if (err) {
        console.error('Error reading post directory:', err);
        return;
      }
      console.log('Files in post directory:', files);
    });
  });
});

req.write(body, 'binary');
req.end();

req.on('error', (e) => {
  console.error('Error:', e);
});