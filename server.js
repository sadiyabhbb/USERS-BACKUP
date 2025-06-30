const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Upload route (NO folder support)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + '-' + file.originalname;
    cb(null, filename);
  }
});
const upload = multer({ storage }).single('file');

app.post('/upload', (req, res) => {
  upload(req, res, function (err) {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const relativePath = req.file.filename;
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(relativePath)}`;

    res.json({
      name: req.file.filename,
      path: relativePath,
      url: fileUrl
    });
  });
});

// List all files from uploads folder only
app.get('/files', (req, res) => {
  try {
    const files = fs.readdirSync(path.join(__dirname, 'uploads'))
      .filter(f => f !== '.gitkeep')
      .map(name => ({
        name,
        path: name,
        url: `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(name)}`
      }));
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Delete file
app.delete('/delete', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });

  const fullPath = path.join(__dirname, 'uploads', filePath);
  fs.unlink(fullPath, err => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ success: true });
  });
});

// Rename file
app.post('/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Old and new paths required' });

  const from = path.join(__dirname, 'uploads', oldPath);
  const to = path.join(__dirname, 'uploads', newPath);

  fs.rename(from, to, err => {
    if (err) return res.status(500).json({ error: 'Rename failed' });
    res.json({ success: true });
  });
});

app.get('/', (req, res) => {
  res.send('🚀 Drive Backup API is running (no folder support).');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
