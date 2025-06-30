const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve all uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer dynamic folder storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.body.path || '';
    const uploadPath = path.join(__dirname, 'uploads', folder);
    fs.mkdirSync(uploadPath, { recursive: true }); // ensure path exists
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Upload with folder support
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const relativePath = path.relative(path.join(__dirname, 'uploads'), req.file.path).replace(/\\/g, '/');
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${relativePath}`;
  res.json({ url: fileUrl, path: relativePath });
});

// Recursively list all files with path
function listFiles(dir = './uploads', fileList = [], base = '') {
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const relPath = path.join(base, item).replace(/\\/g, '/');
    if (fs.statSync(fullPath).isDirectory()) {
      listFiles(fullPath, fileList, relPath);
    } else {
      fileList.push({
        name: item,
        path: relPath,
        url: `uploads/${relPath}`
      });
    }
  });
  return fileList;
}

// GET all files (with folder info)
app.get('/files', (req, res) => {
  try {
    const files = listFiles();
    res.json(files.map(file => ({
      name: file.name,
      path: file.path,
      url: `${req.protocol}://${req.get('host')}/${file.url}`
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file (with folder path)
app.delete('/delete', (req, res) => {
  const filePath = req.query.path;
  if (!filePath) return res.status(400).json({ error: 'File path required' });

  const fullPath = path.join(__dirname, 'uploads', filePath);
  fs.unlink(fullPath, err => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ success: true });
  });
});

// Rename file (with folder support)
app.post('/rename', (req, res) => {
  const { oldPath, newPath } = req.body;
  if (!oldPath || !newPath) return res.status(400).json({ error: 'Both old and new paths required' });

  const oldFull = path.join(__dirname, 'uploads', oldPath);
  const newFull = path.join(__dirname, 'uploads', newPath);

  fs.rename(oldFull, newFull, err => {
    if (err) return res.status(500).json({ error: 'Rename failed' });
    res.json({ success: true });
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Drive Backup API with Folder Support is running.');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
