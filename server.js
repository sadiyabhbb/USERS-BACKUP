// ✅ server.js (Backup Storage Server)
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// ✅ Root route fix
app.get('/', (req, res) => {
  res.send('✅ Backup Storage Server is running!');
});

// ✅ Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const fileData = {
    name: req.file.filename,
    url: fileUrl,
    time: new Date().toISOString()
  };

  const dataPath = 'data.json';
  let existing = [];
  if (fs.existsSync(dataPath)) {
    existing = JSON.parse(fs.readFileSync(dataPath));
  }
  existing.push(fileData);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));

  res.json({ url: fileUrl });
});

// ✅ List files route
app.get('/files', (req, res) => {
  const dataPath = 'data.json';
  if (!fs.existsSync(dataPath)) return res.json([]);
  const files = JSON.parse(fs.readFileSync(dataPath));
  res.json(files);
});

// ✅ Serve uploaded files directly
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('❌ File not found in backup');
  }
  res.sendFile(filePath);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Backup storage running on port ${port}`);
});
