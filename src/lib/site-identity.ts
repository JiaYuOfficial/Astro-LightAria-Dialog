export interface SiteIdentityConfig {
  name: string;
  logo: string;
  user: { name: string; avatar: string };
}

export interface SiteInfoRow {
  label: string;
  value: string;
}

/** All visible site/user identity comes from these four configuration fields. */
export function resolveSiteIdentity(config: SiteIdentityConfig) {
  const name = config.name.trim();
  if (!name) throw new Error('site.name 不能为空，请在站点配置中填写站点名称');
  const logo = config.logo.trim();
  return {
    name,
    logo,
    user: {
      name: config.user.name.trim() || name,
      avatar: config.user.avatar.trim() || logo,
    },
  };
}

/** Pages provide their own heading; the shared layout appends the site name once. */
export function formatPageTitle(pageTitle: string | undefined, siteName: string): string {
  const title = pageTitle?.trim() || '';
  if (!title || title === siteName || title.endsWith(` · ${siteName}`)) return title || siteName;
  return `${title} · ${siteName}`;
}

/** Empty assets stay empty; relative assets share the site's canonical URL base. */
export function absoluteAssetUrl(value: string, baseUrl = ''): string {
  const asset = value.trim();
  if (!asset) return '';
  try {
    return new URL(asset, baseUrl.trim() || undefined).href;
  } catch {
    return asset;
  }
}

/** Built-in friend-exchange information is derived, never configured a second time. */
export function buildSiteInfo(
  config: SiteIdentityConfig & { description: string },
  baseUrl: string,
  extraRows: readonly SiteInfoRow[] = [],
): SiteInfoRow[] {
  const identity = resolveSiteIdentity(config);
  return [
    { label: '名称', value: identity.name },
    { label: '网址', value: baseUrl.trim().replace(/\/$/, '') },
    { label: 'Logo', value: absoluteAssetUrl(identity.logo, baseUrl) },
    { label: '描述', value: config.description },
    ...extraRows.map((row) => ({ ...row })),
  ];
}
