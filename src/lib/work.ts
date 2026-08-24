// 分类工具（逻辑由 site.autoCategoryFromTitle 开关控制，默认启用）：
// 1. frontmatter 的 category 字段优先；
// 2. category 为空且开关开启 → 取标题第一个方括号【】或 [] 内的字段；
// 3. 都没有 → 归入「未分类」
import { site } from '../config/site';

export function getCategory(w: {
  data: { title: string; category?: string | undefined; tags: string[] };
}): string {
  if (w.data.category) return w.data.category;
  if (site.autoCategoryFromTitle) {
    const m = String(w.data.title || '').match(/【(.+?)】|\[(.+?)\]/);
    const t = m ? (m[1] || m[2] || '').trim() : '';
    if (t) return t;
  }
  return '未分类';
}
