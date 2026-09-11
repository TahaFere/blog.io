// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const selectBtn = document.getElementById('selectBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');

let selectedFiles = [];

// File Selection
selectBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  selectedFiles = Array.from(e.target.files);
  if (selectedFiles.length > 0) {
    uploadFiles();
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
    uploadFiles();
  }
});

/**
 * Dosyaları Google Drive'a Yükle
 */
async function uploadFiles() {
  if (selectedFiles.length === 0) return;

  // UI Güncelle
  uploadArea.style.display = 'none';
  progressSection.style.display = 'block';
  resultsSection.style.display = 'none';

  const results = [];
  const totalFiles = selectedFiles.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = selectedFiles[i];
    progressText.textContent = `Yükleniyor: ${file.name} (${i + 1}/${totalFiles})`;
    progressFill.style.width = `${(i / totalFiles) * 100}%`;

    try {
      const result = await uploadSingleFile(file);
      results.push({
        name: file.name,
        status: 'success',
        link: result.link,
      });
    } catch (error) {
      results.push({
        name: file.name,
        status: 'error',
        error: error.message,
      });
    }
  }

  // Final Progress
  progressFill.style.width = '100%';
  progressText.textContent = 'Tamamlandı! ✅';

  // Show Results
  setTimeout(() => {
    showResults(results);
    loadFiles();
  }, 1000);
}

/**
 * Tek Dosya Yükle
 */
async function uploadSingleFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Yükleme başarısız');
  }

  return await response.json();
}

/**
 * Sonuçları Göster
 */
function showResults(results) {
  progressSection.style.display = 'none';
  resultsSection.style.display = 'block';

  resultsList.innerHTML = results
    .map(
      (result) =>
        `
    <div class="result-item ${result.status}">
      <span class="result-icon">${result.status === 'success' ? '✅' : '❌'}</span>
      <span class="result-text">
        ${result.name}
        ${result.status === 'error' ? `<br><small>${result.error}</small>` : ''}
      </span>
      ${result.status === 'success' ? `<a href="${result.link}" target="_blank" style="color: inherit; text-decoration: none;">🔗</a>` : ''}
    </div>
    `
    )
    .join('');
}

/**
 * Google Drive Dosyalarını Yükle
 */
async function loadFiles() {
  try {
    filesList.innerHTML = '<p class="loading">Yükleniyor...</p>';

    const response = await fetch('/api/files');
    const data = await response.json();

    if (!data.success || !data.files || data.files.length === 0) {
      filesList.innerHTML =
        '<p class="loading">Henüz dosya yok. Yüklemeye başla! 📸</p>';
      return;
    }

    filesList.innerHTML = data.files
      .map((file) => {
        const isImage = file.mimeType.startsWith('image/');
        const isVideo = file.mimeType.startsWith('video/');
        const icon = isImage ? '🖼️' : isVideo ? '🎥' : '📄';

        return `
      <div class="file-item" onclick="window.open('${file.webViewLink}', '_blank')">
        <div class="file-icon">${icon}</div>
        <div class="file-name" title="${file.name}">${file.name}</div>
      </div>
    `;
      })
      .join('');
  } catch (error) {
    filesList.innerHTML = `<p class="loading" style="color: red;">Hata: ${error.message}</p>`;
  }
}

// Refresh Button
refreshBtn.addEventListener('click', loadFiles);

// Sayfa Yüklenmesinde Dosyaları Getir
document.addEventListener('DOMContentLoaded', loadFiles);
