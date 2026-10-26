/** Public content statistics; only aggregate counts are intended for the DOM. */
export type SiteStatKey = 'moment' | 'video' | 'article' | 'gallery';
export interface SiteStatWork {
  type: 'article' | 'photo' | 'video';
  images?: readonly unknown[];
}
export interface SiteStatCategory {
  key: SiteStatKey;
  label: string;
  count: number;
  percent: number;
  startAngle: number;
  endAngle: number;
}
export interface SiteStats {
  total: number;
  categories: SiteStatCategory[];
}

export function classifySiteWork(work: SiteStatWork): Exclude<SiteStatKey, 'moment'> {
  if (work.type === 'video') return 'video';
  return work.type === 'photo' && (work.images?.length ?? 0) > 0 ? 'gallery' : 'article';
}

/** Moments count once, including those containing a video. Dates do not filter totals. */
export function aggregateSiteStats(works: readonly SiteStatWork[], moments: readonly unknown[]): SiteStats {
  const counts: Record<SiteStatKey, number> = { moment: moments.length, video: 0, article: 0, gallery: 0 };
  for (const work of works) counts[classifySiteWork(work)] += 1;
  const total = works.length + moments.length;
  const categories: SiteStatCategory[] = [];
  const labels: Record<SiteStatKey, string> = { moment: '动态', video: '视频', article: '图文', gallery: '图集' };
  let consumed = 0;
  for (const key of ['moment', 'video', 'article', 'gallery'] as const) {
    const startAngle = total ? consumed / total * 360 : 0;
    consumed += counts[key];
    categories.push({ key, label: labels[key], count: counts[key], percent: total ? counts[key] / total * 100 : 0,
      startAngle, endAngle: total ? consumed / total * 360 : 0 });
  }
  return { total, categories };
}

export function formatSiteStatPercent(percent: number): string {
  if (!Number.isFinite(percent) || percent <= 0) return '0%';
  if (percent < 0.1) return '<0.1%';
  return `${Number(Math.min(100, percent).toFixed(1))}%`;
}

export function describeSiteStat(category: Pick<SiteStatCategory, 'label' | 'count' | 'percent'>): string {
  return `${category.label}：${category.count} 条，占 ${formatSiteStatPercent(category.percent)}`;
}

/** Filled annular sector. No center disk, overlaid circles or full-circle hit areas.
 * Full turns use two arcs per boundary because a single SVG arc cannot close a circle.
 * Zero/invalid spans produce no path. Angles start at 12 o'clock, clockwise.
 */
export function siteStatArcPath(startAngle: number, endAngle: number, options: {
  center?: number; outerRadius?: number; innerRadius?: number;
} = {}): string {
  const { center = 64, outerRadius = 54, innerRadius = 35 } = options;
  if (![startAngle, endAngle, center, outerRadius, innerRadius].every(Number.isFinite)
    || outerRadius <= innerRadius || innerRadius <= 0 || endAngle <= startAngle) return '';
  const span = Math.min(360, endAngle - startAngle);
  const point = (radius: number, angle: number) => {
    const radians = (angle - 90) * Math.PI / 180;
    // Preserve very small positive spans; six decimal rounding can erase tiny categories.
    return `${center + radius * Math.cos(radians)} ${center + radius * Math.sin(radians)}`;
  };
  const outerStart = point(outerRadius, startAngle);
  const innerStart = point(innerRadius, startAngle);
  if (span === 360) {
    const outerOpposite = point(outerRadius, startAngle + 180);
    const innerOpposite = point(innerRadius, startAngle + 180);
    return `M ${outerStart} A ${outerRadius} ${outerRadius} 0 1 1 ${outerOpposite} A ${outerRadius} ${outerRadius} 0 1 1 ${outerStart} L ${innerStart} A ${innerRadius} ${innerRadius} 0 1 0 ${innerOpposite} A ${innerRadius} ${innerRadius} 0 1 0 ${innerStart} Z`;
  }
  const end = startAngle + span;
  const largeArc = span > 180 ? 1 : 0;
  return `M ${outerStart} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${point(outerRadius, end)} L ${point(innerRadius, end)} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart} Z`;
}
