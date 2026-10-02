// 站点个性化设置：布局 / 风格 / 背景 / 主题色 / 模糊度 / 亮度 / 字号 / 信息流模式。
// 状态持久化在 localStorage，默认值来自 body 上的 data-* （由 site.ts 注入）。
const LAYOUT_KEY = 'photo-blog-layout';
const STYLE_KEY = 'photo-blog-style';
const BG_KEY = 'photo-blog-bg';
const BLUR_KEY = 'photo-blog-blur';

// 网格模式入场顺序：按视觉从上到下重排（columns 瀑布流 DOM 顺序是列优先，视觉会乱）
// 初始卡片动画处于暂停态（CSS 控制），布局稳定后通过 feed-anim 只触发一次播放，避免「卡两下」
function orderMasonryByTop() {
  if (!document.body.classList.contains('layout-masonry')) return;
  const cards = Array.from(document.querySelectorAll('body.layout-masonry .work-card'));
  if (!cards.length) return;
  const sorted = cards
    .map((el) => ({ el, top: el.getBoundingClientRect().top }))
    .sort((a, b) => a.top - b.top);
  sorted.forEach((it, i) => { it.el.style.animationDelay = i * 40 + 'ms'; });
  document.body.classList.remove('feed-anim');
  void document.body.offsetWidth;
  document.body.classList.add('feed-anim');
}
// 载入：等待布局稳定（load + 超时兜底）后触发一次播放
(function tryStartMasonry() {
  if (!document.body.classList.contains('layout-masonry')) return;
  if (document.readyState === 'complete') { requestAnimationFrame(orderMasonryByTop); return; }
  let started = false;
  const go = () => { if (!started) { started = true; requestAnimationFrame(orderMasonryByTop); } };
  window.addEventListener('load', go);
  setTimeout(go, 800); // 兜底：资源慢时 800ms 后也播放，避免永久空白
})();

// 样式/布局切换：信息流淡入过渡
function pulseFeed() {
  const feed = document.querySelector('.feed-wrap, .archive-card');
  if (!feed) return;
  feed.classList.remove('layout-switch');
  void feed.offsetWidth;
  feed.classList.add('layout-switch');
}
function applyLayout(l) {
  document.body.classList.remove('layout-masonry', 'layout-list', 'layout-compact');
  document.body.classList.add('layout-' + l);
  localStorage.setItem(LAYOUT_KEY, l);
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('layout-opt--active', b.dataset.layout === l);
  });
  pulseFeed();
  if (l === 'masonry') setTimeout(orderMasonryByTop, 120);
}
function applyStyle(s) {
  document.body.classList.remove('style-glass', 'style-flat');
  document.body.classList.add('style-' + s);
  localStorage.setItem(STYLE_KEY, s);
  document.querySelectorAll('[data-style]').forEach((b) => {
    b.classList.toggle('layout-opt--active', b.dataset.style === s);
  });
  // 玻璃模糊度：扁平模式无模糊，隐藏（带过渡动画）
  const blurRow = document.getElementById('blurRow');
  if (blurRow) blurRow.classList.toggle('bg-dim-hidden', s !== 'glass');
  pulseFeed();
}
function applyBg(on) {
  document.body.classList.toggle('has-bg', on);
  localStorage.setItem(BG_KEY, on ? 'on' : 'off');
  document.querySelectorAll('[data-bg]').forEach((b) => {
    b.classList.toggle('layout-opt--active', (b.dataset.bg === 'on') === on);
  });
  // 背景图亮度：仅在显示背景图时可调节（带过渡动画）
  const bgDimGroup = document.getElementById('bgDimGroup');
  if (bgDimGroup) bgDimGroup.classList.toggle('bg-dim-hidden', !on);
}
// 主题色：切换 --lg-accent 系变量；无背景图模式下背景光斑同步换色
const ACCENT_KEY = 'lightaria-accent';
function hexToRgbaJs(hex, a) {
  const h = String(hex || '').replace('#', '');
  if (h.length !== 6) return 'rgba(102,204,255,' + a + ')';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function applyAccent(c) {
  const root = document.documentElement.style;
  root.setProperty('--lg-accent', hexToRgbaJs(c, 0.28));
  root.setProperty('--lg-accent-border', hexToRgbaJs(c, 0.55));
  root.setProperty('--lg-accent-solid', c);
  // 无背景图模式的背景光斑：跟随主题色（同色系不同强度）
  root.setProperty('--bg-blob-1', hexToRgbaJs(c, 0.38));
  root.setProperty('--bg-blob-2', hexToRgbaJs(c, 0.32));
  root.setProperty('--bg-blob-3', hexToRgbaJs(c, 0.26));
  root.setProperty('--bg-blob-4', hexToRgbaJs(c, 0.22));
  localStorage.setItem(ACCENT_KEY, c);
  document.querySelectorAll('[data-accent]').forEach((b) => {
    b.classList.toggle('color-opt--active', b.dataset.accent === c);
  });
}
applyAccent(localStorage.getItem(ACCENT_KEY) || document.body.dataset.defaultAccent || '#66ccff');
document.querySelectorAll('[data-accent]').forEach((b) =>
  b.addEventListener('click', () => applyAccent(b.dataset.accent))
);
// 初始：本地记忆优先，否则按设备宽度选配置默认（电脑/手机可分开设置）
const isMobileVw = () => window.innerWidth <= 880;
const defLayout = (isMobileVw() ? document.body.dataset.layoutMobile : document.body.dataset.layoutDesktop) || 'masonry';
const defStyle = document.body.dataset.defaultStyle || 'glass';
const defBg = document.body.dataset.defaultBg === 'true';
const defBlur = document.body.dataset.defaultBlur || '16';
applyLayout(localStorage.getItem(LAYOUT_KEY) || defLayout);
applyStyle(localStorage.getItem(STYLE_KEY) || defStyle);
applyBg(localStorage.getItem(BG_KEY) ? localStorage.getItem(BG_KEY) === 'on' : defBg);

// 玻璃模糊度滑杆
const blurRange = document.getElementById('blurRange');
function applyBlur(v) {
  document.documentElement.style.setProperty('--lg-blur', v + 'px');
  if (blurRange) blurRange.value = v;
  localStorage.setItem(BLUR_KEY, v);
}
applyBlur(localStorage.getItem(BLUR_KEY) || defBlur);
blurRange?.addEventListener('input', () => applyBlur(blurRange.value));

// 背景亮度滑杆（100% = 不压暗最亮，0 = 全黑；内部转压暗强度 dim = (100-p)/100）
const BG_DIM_KEY = 'photo-blog-bgdim';
const bgDimRange = document.getElementById('bgDimRange');
function applyBgDim(p) {
  const dim = Math.max(0, Math.min(1, (100 - p) / 100));
  document.documentElement.style.setProperty('--bg-dim', String(dim));
  if (bgDimRange) bgDimRange.value = p;
  localStorage.setItem(BG_DIM_KEY, p);
}
const defBgDim = parseFloat(document.body.dataset.defaultBgdim || '0.55');
const defBgDimPct = Math.round((1 - Math.max(0, Math.min(1, defBgDim))) * 100);
applyBgDim(parseInt(localStorage.getItem(BG_DIM_KEY), 10) || defBgDimPct);
bgDimRange?.addEventListener('input', () => applyBgDim(bgDimRange.value));

// 正文字号滑杆
const fontRange = document.getElementById('fontRange');
const FONT_KEY = 'photo-blog-font';
function applyFont(v) {
  document.documentElement.style.setProperty('--md-font-size', v + 'px');
  if (fontRange) fontRange.value = v;
  localStorage.setItem(FONT_KEY, v);
}
const defFont = document.body.dataset.defaultFont || '17';
applyFont(localStorage.getItem(FONT_KEY) || defFont);
fontRange?.addEventListener('input', () => applyFont(fontRange.value));

// 设置面板选项（布局/风格/背景/信息流模式）
document.querySelectorAll('.layout-opt').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.layout) applyLayout(b.dataset.layout);
    if (b.dataset.style) applyStyle(b.dataset.style);
    if (b.dataset.bg) applyBg(b.dataset.bg === 'on');
    if (b.dataset.feed) applyFeed(b.dataset.feed);
  })
);

// 主页展示模式：'paged'（分页）/'infinite'（无限流）—— 与首页 index.astro 通过 localStorage + 事件联动
const FEED_KEY = 'lightaria-feed-mode';
const defFeed = document.body.dataset.defaultFeed || 'paged';
function applyFeed(m) {
  localStorage.setItem(FEED_KEY, m);
  document.querySelectorAll('[data-feed]').forEach((b) => {
    b.classList.toggle('layout-opt--active', b.dataset.feed === m);
  });
  window.dispatchEvent(new CustomEvent('lightaria:feed', { detail: m }));
}
applyFeed(localStorage.getItem(FEED_KEY) || defFeed);
