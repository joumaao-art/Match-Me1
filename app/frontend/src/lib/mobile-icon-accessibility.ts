export const ICON_ACTION_COPY = {
 back: ['Go Back', 'العودة'], close: ['Close', 'إغلاق'], search: ['Search', 'بحث'], share: ['Share Job', 'مشاركة الوظيفة'],
 edit: ['Edit', 'تعديل'], delete: ['Delete', 'حذف'], download: ['Download', 'تنزيل'], upload: ['Upload CV', 'رفع السيرة الذاتية'],
 language: ['Change Language', 'تغيير اللغة'], more: ['Open conversation menu', 'فتح قائمة المحادثة'], attachment: ['Add attachment', 'إضافة مرفق'], send: ['Send message', 'إرسال رسالة'],
 up: ['Scroll up', 'التمرير لأعلى'], down: ['Scroll down', 'التمرير لأسفل'],
 external: ['Open link', 'فتح الرابط'], archive: ['Archive', 'أرشفة'], settings: ['Settings', 'الإعدادات'], check: ['Confirm', 'تأكيد'], info: ['Information', 'معلومات'], bookmark: ['Save', 'حفظ'], heart: ['Apply', 'تقديم'], logout: ['Logout', 'تسجيل الخروج'],
} as const;
export function fallbackIconLabel(classes: string, arabic: boolean): string | undefined {
 const mapping: [string, keyof typeof ICON_ACTION_COPY][] = [
  ['more-horizontal','more'],['external-link','external'],['archive','archive'],['settings','settings'],['check','check'],['info','info'],['bookmark','bookmark'],['heart','heart'],['log-out','logout'],['arrow-left','back'],['undo','back'],['x','close'],['search','search'],['share','share'],['edit','edit'],['pencil','edit'],['trash','delete'],['download','download'],['upload','upload'],['globe','language'],['more-vertical','more'],['paperclip','attachment'],['send','send'],['chevron-up','up'],['chevron-down','down'],
 ];
 const key = mapping.find(([icon]) => classes.split(/\s+/).some(c => c === `lucide-${icon}` || c.startsWith(`lucide-${icon}-`)))?.[1];
 return key ? ICON_ACTION_COPY[key][arabic ? 1 : 0] : undefined;
}
export function iconTone(variant: string | null, classes: string): 'primary' | 'secondary' | 'inverse' | 'destructive' | 'success' | 'neutral' {
 if (/(^|\s)bg-black(\s|$)/.test(classes)) return 'inverse';
 if (/text-(red-|destructive)/.test(classes) || variant === 'destructive') return 'destructive';
 if (/text-green-/.test(classes)) return 'success';
 if (variant === 'default' || variant === 'secondary' || /(^|\s)bg-(primary|secondary)(\s|$)/.test(classes)) return 'primary';
 if (/(^|\s)text-primary(\s|$)/.test(classes)) return 'secondary';
 return 'neutral';
}
export function mobileIconScope(path: string, role: string | null, mobile: boolean): boolean {
 if (!mobile || role === 'company' || role === 'admin') return false;
 return path === '/' || path === '/auth' || path.startsWith('/auth/reset') || path.startsWith('/seeker') || path.startsWith('/jobs/') || (role === 'job_seeker' && (path.startsWith('/messages') || path === '/notifications'));
}
