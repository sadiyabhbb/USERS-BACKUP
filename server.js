const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Upload route with dynamic folder support
app.post('/upload', (req, res, next) => {
  const folder = req.query.path || req.body.path || '';

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const targetPath = path.join(__dirname, 'uploads', folder);
      fs.mkdirSync(targetPath, { recursive: true });
      cb(null, targetPath);
    },
    filename: (req, file, cb) => {
      const filename = Date.now() + '-' + file.originalname;
      cb(null, filename);
    }
  });

  const upload = multer({ storage }).single('file');

  upload(req, res, function (err) {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const relativePath = path.join(folder, req.file.filename).replace(/\\/g, '/');
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(relativePath)}`;

    res.json({
      name: req.file.filename,
      path: relativePath,
      url: fileUrl
    });
  });
});

// List all files recursively
const walk = (dir = '', fileList = []) => {
  const files = fs.readdirSync(path.join(__dirname, 'uploads', dir));
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const absPath = path.join(__dirname, 'uploads', fullPath);
    const stat = fs.statSync(absPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else {
      fileList.push({
        name: file,
        path: fullPath.replace(/\\/g, '/'),
        url: `uploads/${encodeURIComponent(fullPath.replace(/\\/g, '/'))}`
      });
    }
  });
  return fileList;
};

app.get('/files', (req, res) => {
  try {
    const files = walk().map(f => ({
      ...f,
      url: `${req.protocol}://${req.get('host')}/${f.url}`
    }));
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read files' });
  }
});

// Delete file by path
app.delete('/delete', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'Path is required' });

  const fullPath = path.join(__dirname, 'uploads', filePath);
  fs.unlink(fullPath, err => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ success: true });
  });
});

// Rename file by full path
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

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Drive Backup API with Folder Support is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
