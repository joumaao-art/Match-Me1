export const APPLICATION_STATUSES = ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'offer_received', 'hired', 'rejected', 'withdrawn'] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];
const LABELS: Record<string, [string, string]> = {
 applied: ['Applied', 'تم التقديم'], under_review: ['Under Review', 'قيد المراجعة'], shortlisted: ['Shortlisted', 'القائمة المختصرة'], interview_scheduled: ['Interview Scheduled', 'تم تحديد المقابلة'], offer_received: ['Offer Received', 'تم استلام عرض'], hired: ['Hired', 'تم التوظيف'], rejected: ['Rejected', 'مرفوض'], withdrawn: ['Withdrawn', 'منسحب'], expired: ['Expired', 'منتهية'], closed: ['Closed', 'مغلقة'], unavailable: ['Unavailable', 'غير متاحة'], unknown: ['Status unavailable', 'الحالة غير متاحة'], saved: ['Saved Jobs', 'الوظائف المحفوظة'], skipped: ['Skipped Jobs', 'الوظائف المتجاوزة'], all: ['All Applications', 'جميع الطلبات'], submitted: ['Submitted Applications', 'الطلبات المقدمة'], search: ['Search', 'بحث'], pending: ['Applied', 'تم التقديم'], reviewed: ['Under Review', 'قيد المراجعة'], interview: ['Interview Scheduled', 'تم تحديد المقابلة'], accepted: ['Shortlisted', 'القائمة المختصرة'],
};
export function recruitmentLabel(status: string, locale: string) { return LABELS[status]?.[locale.startsWith('ar') ? 1 : 0] || LABELS.unknown[locale.startsWith('ar') ? 1 : 0]; }
export function applicationStatus(action: { application_status: string | null; company_status?: string }): ApplicationStatus | 'unknown' | null {
 if (action.application_status === 'withdrawn') return 'withdrawn';
 if (!action.application_status) return null;
 const aliases: Record<string, ApplicationStatus> = { pending: 'applied', reviewed: 'under_review', accepted: 'shortlisted', interview: 'interview_scheduled' };
 const value = aliases[action.company_status || 'pending'] || action.company_status;
 return APPLICATION_STATUSES.includes(value as ApplicationStatus) ? value as ApplicationStatus : 'unknown';
}
export function recruitmentColor(status: string) {
 if (['shortlisted', 'offer_received', 'hired'].includes(status)) return 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200';
 if (status === 'rejected') return 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200';
 if (['applied', 'under_review', 'interview_scheduled'].includes(status)) return 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200';
 return 'bg-muted text-muted-foreground';
}
