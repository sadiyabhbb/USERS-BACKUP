const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'data.json');

// Make sure uploads dir exists
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = Date.now() + '_' + file.originalname;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `/uploads/${req.file.filename}`;
  const fileEntry = {
    url: fileUrl,
    time: new Date().toISOString()
  };

  let history = [];
  if (fs.existsSync(dataFile)) {
    history = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  }
  history.push(fileEntry);
  fs.writeFileSync(dataFile, JSON.stringify(history, null, 2));

  res.json({ message: '✅ File uploaded', url: fileUrl });
});

// History route
app.get('/history', (req, res) => {
  if (!fs.existsSync(dataFile)) return res.json([]);
  const history = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  res.json(history);
});

// Default route
app.get('/', (req, res) => {
  res.send('✅ DRIVE MAIN STORAGE LIVE');
});

app.listen(PORT, () => {
  console.log(`🚀 Backup Storage running on http://localhost:${PORT}`);
});
