import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 部署后替换为你的正式域名（用于 canonical / OG / sitemap）
  site: 'https://example.com',
  integrations: [sitemap()],
  build: {
    // 带宽小场景：CSS 强制内联进 HTML，每页只发一次请求
    inlineStylesheets: 'always',
  },
});
