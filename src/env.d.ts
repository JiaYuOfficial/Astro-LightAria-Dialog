// 全局类型声明（只有类型，不产生任何运行时代码）：
// 1) src/scripts/*.js 挂到 window 上的公开方法，供各页面脚本复用；
// 2) src/layouts/BaseLayout.astro 经 define:vars 注入的站点运行时配置；
// 3) CDN 动态加载的第三方库全局变量。

// —— 二维码生成库（qrcode-generator，由 BaseLayout 以 /vendor/qrcode-*.js 引入）——
declare var qrcode: (
  typeNumber: number,
  errorCorrectionLevel: string
) => {
  addData(data: string): void;
  make(): void;
  createDataURL(cellSize: number, margin: number): string;
};

// —— CDN 按需加载的评论库（见 src/scripts/comments.js）——
// 未加载时这些全局变量并不存在，因此仅用于「存在性判断 + 调用」。
declare var twikoo: {
  init(opts: { envId: string; el: string; path?: string; lang?: string }): void;
  getCommentsCount(opts: { envId: string; urls: string[] }): Promise<Record<string, number>>;
};
declare var Waline: new (opts: { el: string; serverURL: string; lang?: string }) => unknown;
declare var Artalk: {
  init(opts: { el: string; server: string; lang?: string }): void;
};
// 微信 JSSDK（见 src/scripts/share.js，按需注入 CDN）
declare var wx: {
  config(opts: Record<string, unknown>): void;
  ready(fn: () => void): void;
  error(fn: () => void): void;
  updateAppMessageShareData(opts: Record<string, unknown>): void;
  updateTimelineShareData(opts: Record<string, unknown>): void;
};

interface Window {
  // —— src/scripts/panels.js：搜索 / 分类 / 筛选 / 设置等通用面板的开合与互斥 ——
  openPanel(el: HTMLElement | null): void;
  forceClosePanel(el: HTMLElement | null): void;
  closePanel(el: HTMLElement | null, done?: () => void): void;

  // —— src/scripts/comments.js：评论按需加载（展开评论时调用）——
  ensureComments(el: HTMLElement | null): void;

  // —— src/pages/works/[...slug].astro：文章底栏「目录」面板 ——
  openToc(): void;
  closeToc(): void;

  // —— BaseLayout 注入的站点配置（对应 src/config/site.ts，功能关闭时不注入）——
  __COMMENTS__: {
    enabled: boolean;
    service: 'twikoo' | 'waline' | 'artalk';
    serverURL: string;
    cdn: string;
    lang: string;
  };
  __SHARE_CFG__: {
    enabled: boolean;
    wechatJSSDK: { enabled: boolean; appId: string; signAPI: string; cdn: string };
  };
  __USER__: { name: string; avatar: string };
}
