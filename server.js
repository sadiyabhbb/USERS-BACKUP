const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors()); // অন্য সার্ভার থেকে আসা upload allow করতে

// ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  res.json({
    message: '✅ Uploaded to storage',
    url: `/uploads/${req.file.filename}`
  });
});

// default home route
app.get('/', (req, res) => {
  res.send('✅ Backup Storage Server Running');
});

app.listen(port, () => {
  console.log(`🚀 Backup running at http://localhost:${port}`);
});
