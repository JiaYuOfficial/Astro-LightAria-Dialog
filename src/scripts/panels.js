// 通用面板：搜索弹层 + 底栏各面板（分类 / 筛选 / 设置）的开合、互斥与关闭。
// 暴露 window.openPanel / forceClosePanel / closePanel，供页面脚本（文章页、动态页）复用。
const searchBtn = document.getElementById('searchBtn');
const searchPop = document.getElementById('searchPop');
const searchInput = document.getElementById('search');
const searchClose = document.getElementById('searchClose');

// 通用面板动画：open 立即显示 + 入场动画；close 播退场动画后隐藏
window.openPanel = function (el) {
  if (!el) return;
  el.hidden = false;
  el.classList.remove('out');
};
window.forceClosePanel = function (el) {
  if (!el) return;
  el.hidden = true;
  el.classList.remove('out');
};
window.closePanel = function (el, done) {
  if (!el) return;
  if (el.hidden) { done && done(); return; }
  el.classList.add('out');
  const finish = () => { el.hidden = true; el.classList.remove('out'); done && done(); };
  el.addEventListener('animationend', (e) => { if (e.target === el) finish(); }, { once: true });
  setTimeout(() => { if (el.classList.contains('out')) finish(); }, 450);
};

function openSearch() {
  if (!searchPop) return;
  window.openPanel(searchPop);
  searchInput?.focus();
}
function closeSearch() {
  if (!searchPop) return;
  if (searchInput && searchInput.value) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  window.closePanel(searchPop);
}

searchBtn?.addEventListener('click', () => {
  (searchPop.hidden || searchPop.classList.contains('out')) ? openSearch() : closeSearch();
});
searchClose?.addEventListener('click', closeSearch);

// 标签面板（主页底栏「分类」）：开时收起设置/目录/筛选
const tagBtn = document.getElementById('tagBtn');
const tagPanel = document.getElementById('tagPanel');
tagBtn?.addEventListener('click', () => {
  if (tagPanel.hidden || tagPanel.classList.contains('out')) {
    window.forceClosePanel(document.getElementById('settingsPanel'));
    window.forceClosePanel(document.getElementById('tocPanel'));
    window.forceClosePanel(document.getElementById('typePanel'));
    window.openPanel(tagPanel);
  } else {
    window.closePanel(tagPanel);
  }
});

// 类型筛选面板（主页底栏「筛选」）：开时收起设置/目录/标签
const typeBtn = document.getElementById('typeBtn');
const typePanel = document.getElementById('typePanel');
typeBtn?.addEventListener('click', () => {
  if (typePanel.hidden || typePanel.classList.contains('out')) {
    window.forceClosePanel(document.getElementById('settingsPanel'));
    window.forceClosePanel(document.getElementById('tocPanel'));
    window.forceClosePanel(tagPanel);
    window.openPanel(typePanel);
  } else {
    window.closePanel(typePanel);
  }
});
// 点击面板以外的空白处关闭分类面板
document.addEventListener('click', (e) => {
  if (tagPanel.hidden || tagPanel.classList.contains('out')) return;
  if (e.target.closest('#tagPanel, #tagBtn')) return;
  window.closePanel(tagPanel);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closePanel(tagPanel); });

// 设置面板：开时收起目录
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const settingsClose = document.getElementById('settingsClose');
settingsBtn?.addEventListener('click', () => {
  if (settingsPanel.hidden || settingsPanel.classList.contains('out')) {
    const tp = document.getElementById('tocPanel');
    if (tp) window.forceClosePanel(tp);
    window.openPanel(settingsPanel);
  } else {
    window.closePanel(settingsPanel);
  }
});
settingsClose?.addEventListener('click', () => { window.closePanel(settingsPanel); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { window.closePanel(settingsPanel); } });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeSearch(); }
});
