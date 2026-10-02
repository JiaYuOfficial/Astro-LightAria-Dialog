// 图片灯箱：点击正文 / 图集 / 动态图片放大（支持多图 + 缩略图预览 + 键盘翻页）
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');
const lightboxThumbs = document.getElementById('lightboxThumbs');
let lbImages = [], lbIndex = 0;
function collectImages() {
  // hero 封面不可点击预览；图集轮播图与正文图、动态图可预览
  return Array.from(document.querySelectorAll('.md img, .gallery__slide img, .moment-img'));
}
function renderLightbox() {
  const img = lbImages[lbIndex];
  if (!img) return;
  // 切图淡入：先淡出 → 换图 → 淡入
  lightboxImg.style.opacity = '0';
  setTimeout(() => {
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightboxImg.style.opacity = '1';
  }, 130);
  const many = lbImages.length > 1;
  lightboxPrev.style.display = many ? '' : 'none';
  lightboxNext.style.display = many ? '' : 'none';
  lightboxThumbs.style.display = many ? '' : 'none';
  lightboxThumbs.innerHTML = '';
  lbImages.forEach((im, i) => {
    const t = document.createElement('img');
    t.loading = 'lazy';
    t.decoding = 'async';
    t.src = im.currentSrc || im.src;
    t.alt = im.alt || '';
    t.className = 'lightbox__thumb' + (i === lbIndex ? ' lightbox__thumb--active' : '');
    t.addEventListener('click', () => { lbIndex = i; renderLightbox(); });
    lightboxThumbs.appendChild(t);
  });
}
function openLightboxAt(index) {
  lbImages = collectImages();
  if (!lbImages.length) return;
  lbIndex = Math.max(0, Math.min(index, lbImages.length - 1));
  renderLightbox();
  window.openPanel(lightbox);
}
function stepLightbox(d) {
  if (!lbImages.length) return;
  lbIndex = (lbIndex + d + lbImages.length) % lbImages.length;
  renderLightbox();
}
document.addEventListener('click', (e) => {
  // 与 collectImages 保持一致：hero 封面不可预览，正文/图集/动态图可预览
  const img = e.target.closest('.md img, .gallery__slide img, .moment-img');
  if (!img) return;
  openLightboxAt(collectImages().indexOf(img));
});
lightboxClose?.addEventListener('click', () => { window.closePanel(lightbox); });
lightboxPrev?.addEventListener('click', () => stepLightbox(-1));
lightboxNext?.addEventListener('click', () => stepLightbox(1));
lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) window.closePanel(lightbox); });
document.addEventListener('keydown', (e) => {
  if (lightbox.hidden) return;
  if (e.key === 'ArrowLeft') stepLightbox(-1);
  if (e.key === 'ArrowRight') stepLightbox(1);
  if (e.key === 'Escape') window.closePanel(lightbox);
});
