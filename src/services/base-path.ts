/** Vite BASE_URL without trailing slash, e.g. '' or '/anti-bulling' */
export function getBasePath(): string {
  const raw = import.meta.env.BASE_URL || '/';
  return raw.replace(/\/$/, '');
}

/** App path → absolute URL path including base (`/settings` → `/anti-bulling/settings`) */
export function withBase(path: string): string {
  const base = getBasePath();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalized === '' ? '/' : normalized;
  if (normalized === '/') return `${base}/`;
  return `${base}${normalized}`;
}

/** Strip base prefix from location.pathname for route matching */
export function stripBase(pathname: string): string {
  const base = getBasePath();
  if (base && (pathname === base || pathname.startsWith(`${base}/`))) {
    const rest = pathname.slice(base.length);
    return rest && rest !== '' ? rest : '/';
  }
  return pathname || '/';
}

export function currentAppPath(): string {
  return stripBase(location.pathname);
}
