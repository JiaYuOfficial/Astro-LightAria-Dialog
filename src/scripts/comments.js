// 评论系统（全站：页面存在 #tcomment 或 #tcomment-* 容器即初始化，配置见 site.ts comments）
// 多个容器 = 多个评论线程（如动态页每条动态独立评论，data-path 区分）
// hidden 容器不自动初始化，由 window.ensureComments(el) 按需加载（点击评论按钮时）
if (window.__COMMENTS__) {
  (function () {
    var cfg = window.__COMMENTS__;
    if (!cfg.serverURL) return;
    var cdnLoaded = false;
    function loadCdn(done) {
      if (cdnLoaded || (window.twikoo && cfg.service === 'twikoo') || (window.Waline && cfg.service === 'waline') || (window.Artalk && cfg.service === 'artalk')) {
        done();
        return;
      }
      var s = document.createElement('script');
      s.src = cfg.cdn;
      s.async = true;
      s.onload = done;
      s.onerror = done;
      document.body.appendChild(s);
      cdnLoaded = true;
    }
    function initOne(el) {
      var path = el.getAttribute('data-path') || location.pathname;
      // Twikoo 会替换传入的 el 元素本身，因此挂载到容器内的 .tk-mount 子元素，
      // 外层容器保持可控（展开/收起）
      var mount = el.querySelector('.tk-mount') || el;
      if (cfg.service === 'twikoo' && window.twikoo) {
        twikoo.init({ envId: cfg.serverURL, el: '#' + mount.id, path: path, lang: cfg.lang });
      } else if (cfg.service === 'waline' && window.Waline) {
        new Waline({ el: '#' + mount.id, serverURL: cfg.serverURL, lang: cfg.lang });
      } else if (cfg.service === 'artalk' && window.Artalk) {
        Artalk.init({ el: '#' + mount.id, server: cfg.serverURL, lang: cfg.lang });
      }
    }
    window.ensureComments = function (el) {
      if (!el || !el.id || el.dataset.loaded) return;
      el.dataset.loaded = '1';
      loadCdn(function () { initOne(el); });
    };
    // 页面加载时：只初始化可见容器（文章页评论区等），hidden 容器等点击再加载
    var visible = Array.from(document.querySelectorAll('[id^="tcomment"]')).filter(function (el) {
      return !el.hidden && el.getBoundingClientRect().width > 0;
    });
    if (visible.length) {
      loadCdn(function () { visible.forEach(initOne); });
    } else {
      loadCdn(function () {}); // 预加载 CDN，动态页点击评论时秒开不卡
    }
  })();
}
