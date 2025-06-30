const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('uploads'));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// File Upload Route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const tempPath = req.file.path;
  const originalName = Date.now() + '_' + req.file.originalname;
  const targetPath = path.join(__dirname, 'uploads', originalName);

  fs.rename(tempPath, targetPath, err => {
    if (err) return res.status(500).json({ error: 'Rename error' });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${originalName}`;

    // Save to data.json
    let data = [];
    try {
      data = JSON.parse(fs.readFileSync('data.json'));
    } catch (e) {}
    data.push({ name: originalName, url: fileUrl, time: new Date().toISOString() });
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    res.json({ message: 'Uploaded', url: fileUrl });
  });
});

// Show all uploaded files
app.get('/files', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('data.json'));
    res.json(data);
  } catch (e) {
    res.json([]);
  }
});

app.listen(port, () => {
  console.log(`Storage server running at http://localhost:${port}`);
});
