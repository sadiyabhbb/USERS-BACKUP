const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Upload folder setup
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// Default route
app.get("/", (req, res) => {
  res.send("✅ Drive Storage Backend is Running!");
});

// Upload API
app.post("/upload", upload.single("file"), (req, res) => {
  const fileData = {
    filename: req.file.filename,
    path: "/uploads/" + req.file.filename,
    uploadedAt: new Date().toISOString(),
  };

  const dataFile = path.join(__dirname, "data.json");
  let data = [];

  if (fs.existsSync(dataFile)) {
    const jsonData = fs.readFileSync(dataFile, "utf-8");
    try {
      data = JSON.parse(jsonData);
    } catch (e) {
      data = [];
    }
  }

  data.push(fileData);
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

  res.status(200).json({ message: "✅ File uploaded", file: fileData });
});

// Get uploaded files
app.get("/data", (req, res) => {
  const dataFile = path.join(__dirname, "data.json");
  if (!fs.existsSync(dataFile)) {
    return res.json([]);
  }

  const jsonData = fs.readFileSync(dataFile, "utf-8");
  try {
    const data = JSON.parse(jsonData);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "❌ Failed to parse data.json" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
