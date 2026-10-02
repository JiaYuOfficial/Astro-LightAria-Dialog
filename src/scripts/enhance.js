// 内容增强：代码块工具条、友链复制、封面比例自适应、图片懒加载淡入。
// 其中「代码块工具条」与「正文图片淡入」在加密文章解密后需要重跑，故抽成以 root 为参数的幂等函数。

// 文章代码块：显示语言标签 + 右上角复制按钮
// （Astro Shiki 渲染结构：<pre class="astro-code" data-language="xxx"><code>…）
function enhanceCodeBlocks(root) {
  root.querySelectorAll('.md pre').forEach((pre) => {
    // 幂等守卫：已注入过复制按钮的代码块直接跳过（解密后重跑时避免重复注入）
    if (pre.querySelector('.code-copy')) return;
    const code = pre.querySelector('code');
    if (!code) return;
    pre.classList.add('code-block');
    // 语言：优先 pre[data-language]，兜底 code class="language-*"
    const lang =
      pre.dataset.language ||
      ((code.className.match(/language-([\w+#.-]+)/) || [])[1] || '');
    if (lang) {
      const tag = document.createElement('span');
      tag.className = 'code-lang';
      tag.textContent = lang;
      pre.appendChild(tag);
    }
    // 复制按钮（右上角）
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy';
    btn.setAttribute('aria-label', '复制代码');
    btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
    btn.addEventListener('click', () => {
      const text = code.innerText;
      const copy = async () => {
        try { await navigator.clipboard.writeText(text); }
        catch (e) {
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
        }
      };
      copy().then(() => {
        btn.classList.add('is-copied');
        btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
        }, 1500);
      });
    });
    pre.appendChild(btn);
  });
}

// 正文图片：懒加载（避免整页图同时下载）+ 加载完成淡入（消除闪白）
function enhanceMdImages(root) {
  root.querySelectorAll('.md img').forEach((im) => {
    if (!im.loading) im.loading = 'lazy';
    // 幂等守卫：同一张图不重复绑定 load 监听
    if (im.dataset.enhanced) return;
    im.dataset.enhanced = '1';
    im.addEventListener('load', () => im.classList.add('loaded'), { once: true });
    if (im.complete && im.naturalWidth) im.classList.add('loaded');
  });
}

// 内容增强入口（可对指定子树重跑）
function enhanceContent(root) {
  enhanceCodeBlocks(root);
  enhanceMdImages(root);
}
enhanceContent(document);

// 加密文章解密后：对注入的正文重跑增强。
// 必须重跑，否则代码块没有复制按钮，且 .md img 的 opacity 恒为 0（图片不可见）。
window.addEventListener('lightaria:decrypted', () => {
  enhanceContent(document.getElementById('decrypted-content') || document);
});

// 友链页：矩形行一键复制
document.querySelectorAll('.friends-info__copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const val = btn.getAttribute('data-value') || '';
    const copy = async () => {
      try { await navigator.clipboard.writeText(val); }
      catch (e) {
        const ta = document.createElement('textarea');
        ta.value = val; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); document.body.removeChild(ta);
      }
    };
    copy().then(() => {
      btn.classList.add('is-copied');
      btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';
      }, 1500);
    });
  });
});

// 封面图自适应：图片加载后按真实宽高比设置卡片比例（cover 不再按 ratio 字段裁切）
document.querySelectorAll('.work-cover img').forEach((img) => {
  const fit = () => {
    if (img.naturalWidth && img.naturalHeight) {
      const cover = img.closest('.work-cover');
      if (cover) cover.style.aspectRatio = img.naturalWidth + ' / ' + img.naturalHeight;
    }
  };
  if (img.complete) fit(); else img.addEventListener('load', fit);
});

// 首页信息流封面图：加载完成淡入（消除滚动懒加载时的闪动）
document.querySelectorAll('.work-cover img').forEach((im) => {
  im.addEventListener('load', () => im.classList.add('loaded'), { once: true });
  if (im.complete && im.naturalWidth) im.classList.add('loaded');
});
