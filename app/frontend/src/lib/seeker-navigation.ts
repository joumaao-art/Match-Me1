export const SEEKER_MOBILE_TABS = [
  { id: 'swipe', labelKey: 'swipe' },
  { id: 'dashboard', labelKey: 'dashboard' },
  { id: 'profile', labelKey: 'profile' },
] as const;
export type MobileNavTab = typeof SEEKER_MOBILE_TABS[number]['id'];

const PROFILE_SECTIONS = ['personal', 'via_resume', 'subscription_overview', 'support', 'faq', 'report', 'account_settings', 'profile', 'cv', 'experience', 'education', 'certificates', 'skills', 'languages', 'portfolio', 'video', 'preferences', 'visibility', 'exposure', 'contact_requests', 'who_viewed', 'invitations', 'notifications', 'settings', 'account'];
const DASHBOARD_SECTIONS = ['dashboard', 'applications', 'matches', 'saved'];
export function activeSeekerMobileTab(section: string): MobileNavTab | null {
  if (section === 'swipe' || section === 'discover') return 'swipe';
  if (PROFILE_SECTIONS.includes(section)) return 'profile';
  if (DASHBOARD_SECTIONS.includes(section)) return 'dashboard';
  return null;
}
export function seekerSection(pathname: string, search: string): string {
  const value = new URLSearchParams(search).get('view') || pathname.split('/')[2] || 'dashboard';
  if (value === 'discover') return 'swipe';
  if (value === 'account') return 'profile';
  return ['swipe', 'messages', ...PROFILE_SECTIONS, ...DASHBOARD_SECTIONS].includes(value) ? value : 'dashboard';
}
export function seekerSectionUrl(section: string): string {
  if (section === 'messages') return '/messages';
  return `/seeker?view=${encodeURIComponent(seekerSection('/seeker', `?view=${section}`))}`;
}
export function accurateBadgeCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
