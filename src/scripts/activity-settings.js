// 关于页活跃记录：与全站设置共用入口，独立处理存储不可用的情况。
export function initActivitySettings(doc = document, win = window) {
  const key = 'lightaria-activity';
  const controls = doc.querySelectorAll('button[data-activity]');
  const defaultEnabled = doc.body.dataset.defaultActivity !== 'false';
  const readPreference = () => {
    try {
      return win.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  function apply(enabled, persist = false) {
    doc.documentElement.dataset.activity = enabled ? 'on' : 'off';
    doc.querySelectorAll('[data-activity-heatmap]').forEach((calendar) => {
      calendar.hidden = !enabled;
    });
    controls.forEach((button) => {
      const active = (button.dataset.activity === 'on') === enabled;
      button.classList.toggle('layout-opt--active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (persist) {
      try {
        win.localStorage.setItem(key, enabled ? 'on' : 'off');
      } catch {
        // 隐私/禁用存储模式下仍允许当前页面即时切换。
      }
    }
    win.dispatchEvent(new win.CustomEvent('lightaria:activity', { detail: enabled }));
  }

  function restore(value) {
    apply(value === 'on' ? true : value === 'off' ? false : defaultEnabled);
  }

  restore(readPreference());
  controls.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.activity === 'on', true));
  });
  win.addEventListener('storage', (event) => {
    if (event.key !== key && event.key !== null) return;
    if (event.storageArea) {
      try {
        if (event.storageArea !== win.localStorage) return;
      } catch {
        return;
      }
    }
    restore(readPreference());
  });
}
