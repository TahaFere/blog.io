// Copy Link Fonksiyonu
function copyLink() {
  const linkInput = document.getElementById('driveLink');
  linkInput.select();
  document.execCommand('copy');
  
  // Feedback
  const btn = event.target;
  const originalText = btn.textContent;
  btn.textContent = '✅ Kopyalandı!';
  setTimeout(() => {
    btn.textContent = originalText;
  }, 2000);
}
