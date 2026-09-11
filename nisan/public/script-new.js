// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('data-tab');
    
    // Remove active from all buttons and contents
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active to clicked button and related content
    btn.classList.add('active');
    document.getElementById(tabId).classList.add('active');
  });
});

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const uploadList = document.getElementById('uploadList');
const actionButtons = document.getElementById('actionButtons');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const cancelBtn = document.getElementById('cancelBtn');
const uploadSummary = document.getElementById('uploadSummary');

let selectedFiles = [];
let isUploading = false;
let isPaused = false;

// File Selection
selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length > 0) {
    startUpload();
  }
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  selectedFiles = Array.from(e.dataTransfer.files);
  if (selectedFiles.length > 0) {
    startUpload();
  }
});

/**
 * Yüklemeyi Başlat
 */
function startUpload() {
  if (!selectedFiles.length) return;

  isUploading = true;
  uploadList.innerHTML = '';
  uploadSummary.style.display = 'none';
  actionButtons.style.display = 'flex';

  // Her dosya için item oluştur
  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'upload-item uploading';
    item.id = `upload-item-${index}`;
    item.innerHTML = `
      <div class="upload-item-icon">📤</div>
      <div class="upload-item-info">
        <div class="upload-item-name">${file.name}</div>
        <div class="upload-item-size">${formatBytes(file.size)}</div>
        <div class="upload-progress-bar">
          <div class="upload-progress-fill" id="progress-${index}"></div>
        </div>
      </div>
      <div class="upload-item-status" id="status-${index}">0%</div>
    `;
    uploadList.appendChild(item);
  });

  // Yüklemeleri başlat
  uploadAllFiles();
}

/**
 * Tüm Dosyaları Yükle
 */
async function uploadAllFiles() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < selectedFiles.length; i++) {
    if (!isUploading) break;

    while (isPaused) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await uploadFile(selectedFiles[i], i);
      successCount++;
      updateItemStatus(i, 'success', '✅');
    } catch (error) {
      errorCount++;
      updateItemStatus(i, 'error', '❌');
    }
  }

  isUploading = false;
  actionButtons.style.display = 'none';
  showSummary(successCount, errorCount);
}

/**
 * Dosya Yükle
 */
async function uploadFile(file, index) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        updateProgress(index, progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve();
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

/**
 * Progress Güncelle
 */
function updateProgress(index, progress) {
  const progressBar = document.getElementById(`progress-${index}`);
  const statusEl = document.getElementById(`status-${index}`);
  
  if (progressBar) {
    progressBar.style.width = progress + '%';
    statusEl.textContent = Math.round(progress) + '%';
  }
}

/**
 * Item Durumunu Güncelle
 */
function updateItemStatus(index, status, icon) {
  const item = document.getElementById(`upload-item-${index}`);
  const statusEl = document.getElementById(`status-${index}`);
  
  if (item) {
    item.classList.remove('uploading', 'success', 'error');
    item.classList.add(status);
  }
  
  if (statusEl) {
    statusEl.textContent = icon;
  }
}

/**
 * Özet Göster
 */
function showSummary(success, error) {
  const total = selectedFiles.length;
  const summaryText = document.getElementById('summaryText');
  
  summaryText.innerHTML = `
    <strong>${total} dosyadan ${success} başarıyla yüklendi</strong><br>
    ${error > 0 ? `<span style="color: #991b1b;">${error} hata oluştu</span>` : ''}
  `;
  
  uploadSummary.style.display = 'block';
}

/**
 * Yüklemeyi Duraklat
 */
pauseBtn.addEventListener('click', () => {
  isPaused = true;
  pauseBtn.style.display = 'none';
  resumeBtn.style.display = 'block';
});

/**
 * Yüklemeyi Devam Ettir
 */
resumeBtn.addEventListener('click', () => {
  isPaused = false;
  pauseBtn.style.display = 'block';
  resumeBtn.style.display = 'none';
});

/**
 * Yüklemeyi İptal Et
 */
cancelBtn.addEventListener('click', () => {
  isUploading = false;
  uploadList.innerHTML = '<p class="small-text">Yükleme iptal edildi.</p>';
  actionButtons.style.display = 'none';
});

/**
 * Byte'ı Okunaklı Formata Çevir
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Link Kopyala
 */
function copyLink() {
  const linkInput = document.getElementById('driveLink');
  linkInput.select();
  document.execCommand('copy');
  
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '✅ Kopyalandı!';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}
