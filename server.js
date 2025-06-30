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

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Static route to serve uploaded files
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
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

  const dataPath = path.join(__dirname, 'data.json');
  let existing = [];
  if (fs.existsSync(dataPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(dataPath));
    } catch (e) {
      existing = [];
    }
  }
  existing.push(fileData);
  fs.writeFileSync(dataPath, JSON.stringify(existing, null, 2));

  res.json({ url: fileUrl });
});

// ✅ List files route
app.get('/files', (req, res) => {
  const dataPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dataPath)) return res.json([]);
  try {
    const files = JSON.parse(fs.readFileSync(dataPath));
    res.json(files);
  } catch (e) {
    res.json([]);
  }
});

// ✅ Serve uploaded files directly
app.get('/uploads/:filename', (req, res) => {
  const filename = path.basename(req.params.filename); // Prevent path traversal
  const filePath = path.resolve(uploadDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('❌ File not found:', filePath);
      return res.status(404).send('❌ File not found in backup');
    }
    res.sendFile(filePath);
  });
})
  res.sendFile(filePath);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Backup storage running on port ${port}`);
});
