const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const uploadDir = path.join(__dirname, 'uploads');

app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Upload route
app.post('/upload', upload.single('file'), (req, res) => {
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// List files route
app.get('/files', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) return res.status(500).json([]);
    const urls = files.map(name => ({
      name,
      url: `${req.protocol}://${req.get('host')}/uploads/${name}`
    }));
    res.json(urls);
  });
});

// Delete file route
app.delete('/delete', (req, res) => {
  const fileName = req.query.name;
  const filePath = path.join(uploadDir, fileName);

  if (!fileName || !fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Delete failed' });
    res.json({ success: true, message: 'File deleted' });
  });
});

// Rename file route
app.post('/rename', (req, res) => {
  const { oldName, newName } = req.body;

  if (!oldName || !newName) {
    return res.status(400).json({ success: false, message: 'Missing file name(s)' });
  }

  const oldPath = path.join(uploadDir, oldName);
  const newPath = path.join(uploadDir, newName);

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ success: false, message: 'Old file not found' });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Rename failed' });
    res.json({ success: true, message: 'File renamed' });
  });
});

// Serve static uploaded files
app.use('/uploads', express.static(uploadDir));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
