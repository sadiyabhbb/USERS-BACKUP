// server.js
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Load or initialize data.json
const dataFile = path.join(__dirname, 'data.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');

// Routes
app.get('/data', (req, res) => {
  const data = JSON.parse(fs.readFileSync(dataFile));
  res.json(data);
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileData = {
    filename: req.file.filename,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`,
    uploadedAt: new Date().toISOString(),
  };

  const data = JSON.parse(fs.readFileSync(dataFile));
  data.push(fileData);
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  res.json({ success: true, file: fileData });
});

// Start server
app.listen(PORT, () => console.log(`🚀 Storage backend running on port ${PORT}`));
