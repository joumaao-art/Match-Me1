export const MOBILE_BREAKPOINT = 768;

/** Limit retained mobile layouts to candidate-facing routes, never Company/Admin. */
export function isSeekerExperiencePath(pathname: string, search: string): boolean {
  if (/^\/(seeker|jobs|messages|subscription)(\/|$)/.test(pathname)) return true;
  if (pathname === '/auth' || pathname.startsWith('/auth/')) {
    return new URLSearchParams(search).get('role') !== 'company';
  }
  return pathname === '/';
}

export function mobileExperience(compact: boolean, native: boolean, compactJourney: boolean, seeker: boolean): boolean {
  return compact || (seeker && (native || compactJourney));
}
