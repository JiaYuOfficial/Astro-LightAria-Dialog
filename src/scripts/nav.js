// 底栏导航按钮：回到顶部 / 返回上一页
// 回到顶部
document.getElementById('toTop')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 返回上一页（无历史记录时回主页）
document.getElementById('backBtn')?.addEventListener('click', () => {
  if (window.history.length > 1) window.history.back();
  else window.location.href = '/';
});
