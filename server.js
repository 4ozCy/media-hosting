const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate a unique ID for the file
    const uniqueId = crypto.randomBytes(5).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, Date.now() + '-' + uniqueId + fileExt);
  }
});

// Create the multer instance
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 2000 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images, videos, and audio files
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only media files are allowed!'));
    }
  }
});

// Serve static files
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/upload', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

app.get('/share/:fileId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'share.html'));
});

app.get('/files', async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    
    const files = fs.readdirSync(uploadDir);
    const fileList = files.map(file => {
      const stats = fs.statSync(path.join(uploadDir, file));
      const fileType = path.extname(file).slice(1).toLowerCase();
      let type = 'unknown';
      
      if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
        type = 'image';
      } else if (['mp4', 'webm', 'mov', 'avi'].includes(fileType)) {
        type = 'video';
      } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
        type = 'audio';
      }
      
      return {
        id: file,
        name: file.substring(file.indexOf('-') + 1),
        path: `/uploads/${file}`,
        size: (stats.size / 1024).toFixed(2) + ' KB',
        type: type,
        uploadDate: stats.mtime,
        shareLink: `/share/${file}`
      };
    });
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/file/:fileId', (req, res) => {
  try {
    const fileId = req.params.fileId;
    const uploadDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadDir, fileId);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const stats = fs.statSync(filePath);
    const fileType = path.extname(fileId).slice(1).toLowerCase();
    let type = 'unknown';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileType)) {
      type = 'image';
    } else if (['mp4', 'webm', 'mov', 'avi'].includes(fileType)) {
      type = 'video';
    } else if (['mp3', 'wav', 'ogg'].includes(fileType)) {
      type = 'audio';
    }
    
    const fileInfo = {
      id: fileId,
      name: fileId.substring(fileId.indexOf('-') + 1),
      path: `/uploads/${fileId}`,
      size: (stats.size / 1024).toFixed(2) + ' KB',
      type: type,
      uploadDate: stats.mtime
    };
    
    res.json(fileInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Handle file upload
app.post('/upload', upload.single('mediaFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  res.redirect('/');
});

// Create necessary directories
const publicDir = path.join(__dirname, 'public');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
