// 分享卡片（封面 + 标题 + 二维码，canvas 生成 PNG）+ 快速分享（微信/系统分享/JSSDK 预留）+ 轻提示
const shareModal = document.getElementById('shareModal');
const shareImg = document.getElementById('shareImg');
const shareDownload = document.getElementById('shareDownload');
const shareModalClose = document.getElementById('shareModalClose');
const SHARE_GRADS = [
  ['#ff9a8b', '#ff6a88'], ['#a18cd1', '#fbc2eb'], ['#84fab0', '#8fd3f4'],
  ['#f6d365', '#fda085'], ['#667eea', '#764ba2'],
];
function shareGrad(s) {
  let n = 0;
  for (const ch of String(s)) n += ch.codePointAt(0);
  return n % 5;
}
function shareWrap(ctx, text, maxWidth) {
  const lines = []; let line = '';
  for (const ch of String(text)) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = ch; }
    else { line = test; }
  }
  if (line) lines.push(line);
  return lines;
}
// 分享卡片用户信息（site.ts user 配置）：封面底部信息压条的头像与昵称
const USER = window.__USER__ || {};
const AVATAR_IMG = (() => {
  if (!USER.avatar) return null;
  const i = new Image();
  i.crossOrigin = 'anonymous';
  i.src = USER.avatar;
  return i;
})();
function drawShareCard(title, tag, dateLine, cover, url, done) {
  const W = 480, H = 640, coverH = 400;
  const [c1, c2] = SHARE_GRADS[shareGrad(title)];
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c1); grad.addColorStop(1, c2);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, coverH);
  const finish = () => done(canvas.toDataURL('image/png'));
  const tasks = [];
  // 封面底部信息压条（头像 + 昵称）
  const drawAvatar = (img) => {
    const ay = coverH - 27;
    ctx.save();
    ctx.beginPath();
    ctx.arc(34 + 16, ay, 16, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(img, 34, ay - 16, 32, 32);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(34 + 16, ay, 16, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  };
  const drawUserBar = () => {
    if (!USER.name && !USER.avatar) return;
    const barH = 54;
    const bg = ctx.createLinearGradient(0, coverH - barH, 0, coverH);
    bg.addColorStop(0, 'rgba(0,0,0,0)');
    bg.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, coverH - barH, W, barH);
    const ay = coverH - 27;
    if (USER.avatar && AVATAR_IMG && AVATAR_IMG.complete && AVATAR_IMG.naturalWidth) drawAvatar(AVATAR_IMG);
    if (USER.name) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = '600 15px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(USER.name, 34 + (USER.avatar ? 42 : 0), ay + 5);
      ctx.restore();
    }
  };
  const paint = (hasCover) => {
    if (!hasCover) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.font = '700 34px -apple-system,"PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      shareWrap(ctx, title, 380).slice(0, 3).forEach((l, i) => ctx.fillText(l, W / 2, 170 + i * 46));
      ctx.restore();
    }
    drawUserBar();
    // 信息区：白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, coverH, W, H - coverH);
    ctx.save();
    ctx.fillStyle = '#14181f';
    ctx.font = '600 25px -apple-system,"PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    shareWrap(ctx, title, 282).slice(0, 3).forEach((l, i) => ctx.fillText(l, 34, coverH + 66 + i * 36));
    // 标签 + 时间
    ctx.fillStyle = '#9aa0aa';
    ctx.font = '500 14px -apple-system,"PingFang SC",sans-serif';
    ctx.fillText(tag + (dateLine ? ' · ' + dateLine : ''), 34, coverH + 210);
    // 扫码阅读提示（右下角）
    ctx.fillStyle = '#9aa0aa';
    ctx.font = '400 12px -apple-system,"PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('扫码阅读', W - 34 - 59, coverH + 46);
    ctx.restore();
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url); qr.make();
      const qi = new Image();
      tasks.push(new Promise((res) => {
        qi.onload = () => { ctx.drawImage(qi, W - 34 - 118, coverH + 60, 118, 118); res(); };
        qi.onerror = res;
        qi.src = qr.createDataURL(6, 0);
      }));
    } catch (e) {}
    // 头像尚未加载完成时，等它加载完再补画
    if (USER.avatar && AVATAR_IMG && !AVATAR_IMG.complete) {
      tasks.push(new Promise((res) => {
        AVATAR_IMG.onload = () => { drawAvatar(AVATAR_IMG); res(); };
        AVATAR_IMG.onerror = res;
      }));
    }
    Promise.all(tasks).then(finish).catch(finish);
  };
  if (cover) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // cover 模式：封面缩放铺满整个封面区域，超出部分裁掉（不再留白）
      const r = Math.max(W / img.width, coverH / img.height);
      const dw = img.width * r, dh = img.height * r;
      ctx.drawImage(img, (W - dw) / 2, (coverH - dh) / 2, dw, dh);
      paint(true);
    };
    img.onerror = () => paint(false);
    img.src = cover;
  } else { paint(false); }
}
function openShareModal(title, tag, dateLine, cover, url) {
  if (!shareModal) return;
  window.openPanel(shareModal);
  lastShare = { title, url };
  shareImg.src = '';
  shareImg.classList.remove('share-card-img');
  shareDownload.href = '#';
  drawShareCard(title, tag, dateLine, cover, url, (dataUrl) => {
    shareImg.src = dataUrl;
    shareImg.classList.remove('share-card-img');
    void shareImg.offsetWidth; // 重触发淡入动画
    shareImg.classList.add('share-card-img');
    shareDownload.href = dataUrl;
    shareDownload.download = 'share-' + Date.now() + '.png';
  });
}
shareModalClose?.addEventListener('click', () => { window.closePanel(shareModal); });
shareModal?.addEventListener('click', (e) => { if (e.target === shareModal) window.closePanel(shareModal); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closePanel(shareModal); });
// 底栏分享按钮（全局可用）：文章页生成文章分享卡；主页/其他页生成「当前页面」分享卡
document.getElementById('shareBtn')?.addEventListener('click', () => {
  const ps = document.getElementById('pageShare');
  if (ps) {
    const url = location.origin + '/works/' + ps.dataset.slug + '/';
    openShareModal(ps.dataset.title || '', ps.dataset.tag || '', ps.dataset.date || '', ps.dataset.cover || '', url);
    return;
  }
  // 通用：分享当前页面（含 ?cat=/?type= 筛选直达链接，扫码直达）
  const q = new URLSearchParams(location.search);
  const cat = q.get('cat');
  const type = q.get('type');
  const lbl = cat || { image: '图文', gallery: '图集', video: '视频' }[type] || (type ? '精选' : '全部作品');
  openShareModal(document.title || '作品集', lbl, '', '', location.href);
});

// ---------- 快速分享（微信内拉起系统分享 / 右上角提示 / JSSDK 升级预留） ----------
const toastEl = document.getElementById('toast');
let toastTimer = null;
function showToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('toast--show'), 2400);
}
const isWechat = /MicroMessenger/i.test(navigator.userAgent);
const shareWechat = document.getElementById('shareWechat');
let lastShare = null;
if (shareWechat) {
  const span = shareWechat.querySelector('span');
  if (span && isWechat) span.textContent = '微信分享';
  shareWechat.addEventListener('click', () => {
    if (!lastShare) return;
    const title = lastShare.title || document.title;
    const url = lastShare.url || location.href;
    const shareData = { title, text: '来看看：' + title, url };
    const fallback = () => {
      if (isWechat) {
        const j = (window.__SHARE_CFG__ && window.__SHARE_CFG__.wechatJSSDK) || null;
        if (j && j.enabled && j.appId && j.signAPI) setupWechatJSSDK(j, shareData);
        else showToast('请点右上角 ⋯ 分享给好友/朋友圈');
      } else {
        copyShareLink(url);
      }
    };
    if (navigator.share) navigator.share(shareData).catch(() => fallback());
    else fallback();
  });
}
function copyShareLink(url) {
  const done = () => showToast('链接已复制');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => legacyCopy(url, done));
  } else {
    legacyCopy(url, done);
  }
}
function legacyCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { showToast('复制失败，请手动复制'); }
  document.body.removeChild(ta);
}
// 微信 JSSDK 升级路径（预留：site.ts share.wechatJSSDK 开启后自动生效）
function setupWechatJSSDK(cfg, shareData) {
  const apply = () => {
    if (!window.wx) return;
    wx.updateAppMessageShareData({
      title: shareData.title, desc: shareData.text, link: shareData.url, imgUrl: '',
      success() { showToast('已配置，请点右上角 ⋯ 分享'); },
    });
    wx.updateTimelineShareData({ title: shareData.title, link: shareData.url, imgUrl: '' });
  };
  if (window.wx) { apply(); return; }
  const s = document.createElement('script');
  s.src = cfg.cdn;
  s.async = true;
  s.onload = () => {
    const sep = cfg.signAPI.includes('?') ? '&' : '?';
    fetch(cfg.signAPI + sep + 'url=' + encodeURIComponent(location.href.split('#')[0]))
      .then((r) => r.json())
      .then((res) => {
        wx.config({
          debug: false,
          appId: res.appId || cfg.appId,
          timestamp: res.timestamp, nonceStr: res.nonceStr, signature: res.signature,
          jsApiList: ['updateAppMessageShareData', 'updateTimelineShareData'],
        });
        wx.ready(apply);
        wx.error(() => showToast('分享配置失败，请点右上角 ⋯ 分享'));
      })
      .catch(() => showToast('分享配置失败，请点右上角 ⋯ 分享'));
  };
  document.body.appendChild(s);
}
