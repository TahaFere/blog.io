const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Root Route - index.html'i sun
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multer Konfigürasyonu - RAM'de tutma
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  }
});

// Google Drive API Setup
const auth = new google.auth.GoogleAuth({
  keyFile: './google-drive-key.json',
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({
  version: 'v3',
  auth: auth,
});

/**
 * Dosya Google Drive'a yükleme
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    const fileName = req.file.originalname;
    const folderId = process.env.DRIVE_FOLDER_ID;

    console.log(`📤 Yükleniyor: ${fileName}`);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: req.file.buffer,
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    console.log(`✅ Başarıyla yüklendi: ${fileName}`);

    res.json({
      success: true,
      fileName: driveResponse.data.name,
      fileId: driveResponse.data.id,
      link: driveResponse.data.webViewLink,
      message: `${fileName} başarıyla yüklendi!`,
    });
  } catch (error) {
    console.error('❌ Yükleme hatası:', error.message);
    res.status(500).json({
      error: 'Yükleme sırasında bir hata oluştu',
      details: error.message,
    });
  }
});

/**
 * Çoklu dosya yükleme
 */
app.post('/api/upload-multiple', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }

    const folderId = process.env.DRIVE_FOLDER_ID;
    const uploadResults = [];

    for (const file of req.files) {
      try {
        const fileMetadata = {
          name: file.originalname,
          parents: [folderId],
        };

        const media = {
          mimeType: file.mimetype,
          body: file.buffer,
        };

        const driveResponse = await drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, name, webViewLink',
        });

        uploadResults.push({
          fileName: driveResponse.data.name,
          status: 'success',
          fileId: driveResponse.data.id,
          link: driveResponse.data.webViewLink,
        });

        console.log(`✅ ${file.originalname} yüklendi`);
      } catch (err) {
        uploadResults.push({
          fileName: file.originalname,
          status: 'error',
          error: err.message,
        });
        console.error(`❌ ${file.originalname} yükleme hatası:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `${uploadResults.filter(r => r.status === 'success').length}/${req.files.length} dosya yüklendi`,
      results: uploadResults,
    });
  } catch (error) {
    console.error('❌ Çoklu yükleme hatası:', error.message);
    res.status(500).json({
      error: 'Yükleme sırasında bir hata oluştu',
      details: error.message,
    });
  }
});

/**
 * Folder'daki dosyaları listele
 */
app.get('/api/files', async (req, res) => {
  try {
    const folderId = process.env.DRIVE_FOLDER_ID;

    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, mimeType, createdTime, webViewLink)',
      pageSize: 100,
    });

    res.json({
      success: true,
      files: response.data.files || [],
    });
  } catch (error) {
    console.error('❌ Dosya listesi alma hatası:', error.message);
    res.status(500).json({
      error: 'Dosyalar alınamadı',
      details: error.message,
    });
  }
});

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server çalışıyor ✅' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Server Başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Nişan Upload Sunucusu başlatıldı: http://localhost:${PORT}`);
  console.log('📁 Drive Folder ID:', process.env.DRIVE_FOLDER_ID);
  console.log('⏳ Hoş geldiniz! Yapılandırma için .env dosyasını kontrol edin.\n');
});
