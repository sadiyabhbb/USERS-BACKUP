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

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
if (!fs.existsSync('./uploads')) {
  fs.mkdirSync('./uploads');
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// List all files
app.get('/files', (req, res) => {
  fs.readdir('./uploads', (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    const fileList = files.map(file => ({
      name: file,
      url: `${req.protocol}://${req.get('host')}/uploads/${file}`,
    }));
    res.json(fileList);
  });
});

// Delete file
app.delete('/delete', (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'File name required' });

  const filePath = path.join(__dirname, 'uploads', name);
  fs.unlink(filePath, err => {
    if (err) return res.status(500).json({ error: 'Delete failed' });
    res.json({ success: true });
  });
});

// Rename file
app.post('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Both old and new names required' });

  const oldPath = path.join(__dirname, 'uploads', oldName);
  const newPath = path.join(__dirname, 'uploads', newName);

  fs.rename(oldPath, newPath, err => {
    if (err) return res.status(500).json({ error: 'Rename failed' });
    res.json({ success: true });
  });
});

// Default route
app.get('/', (req, res) => {
  res.send('🚀 Drive Backup API is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
