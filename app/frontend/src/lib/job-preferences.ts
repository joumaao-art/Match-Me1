/**
 * Canonical Job Seeker preferences shared by onboarding, Preferences, Discover
 * matching and recommendations. Desired roles (expertise codes) are kept
 * separate from historical career records. Persisted per user in the browser.
 */

import { EMPLOYMENT_TYPES, normalizeEmploymentType, type EmploymentTypeCode } from './profile-standards';

export interface ExpertiseItem { code: string; en: string; ar: string; group: string; keywords: string[] }

export const EXPERTISE_TAXONOMY: ExpertiseItem[] = [
  { code: 'frontend_dev', en: 'Frontend Developer', ar: 'مطور واجهات أمامية', group: 'Software Development', keywords: ['react', 'frontend', 'javascript', 'typescript', 'css', 'tailwind', 'ui'] },
  { code: 'backend_dev', en: 'Backend Developer', ar: 'مطور خلفية', group: 'Software Development', keywords: ['node', 'backend', 'api', 'java', 'python', 'postgresql', 'sql'] },
  { code: 'fullstack_dev', en: 'Full Stack Developer', ar: 'مطور متكامل', group: 'Software Development', keywords: ['full stack', 'fullstack', 'react', 'node'] },
  { code: 'mobile_dev', en: 'Mobile Developer', ar: 'مطور تطبيقات جوال', group: 'Software Development', keywords: ['ios', 'android', 'flutter', 'react native', 'mobile'] },
  { code: 'devops', en: 'DevOps Engineer', ar: 'مهندس DevOps', group: 'Software Development', keywords: ['devops', 'aws', 'docker', 'kubernetes', 'cloud'] },
  { code: 'qa_engineer', en: 'QA Engineer', ar: 'مهندس ضمان جودة', group: 'Software Development', keywords: ['qa', 'testing', 'automation'] },
  { code: 'data_scientist', en: 'Data Scientist', ar: 'عالم بيانات', group: 'Data & AI', keywords: ['data science', 'machine learning', 'python', 'statistics'] },
  { code: 'data_analyst', en: 'Data Analyst', ar: 'محلل بيانات', group: 'Data & AI', keywords: ['analytics', 'sql', 'excel', 'power bi', 'tableau'] },
  { code: 'ml_engineer', en: 'Machine Learning Engineer', ar: 'مهندس تعلم آلي', group: 'Data & AI', keywords: ['ml', 'ai', 'deep learning', 'pytorch'] },
  { code: 'ux_designer', en: 'UX/UI Designer', ar: 'مصمم تجربة وواجهة المستخدم', group: 'Design & UX', keywords: ['figma', 'ux', 'ui', 'design'] },
  { code: 'graphic_designer', en: 'Graphic Designer', ar: 'مصمم جرافيك', group: 'Design & UX', keywords: ['photoshop', 'illustrator', 'branding'] },
  { code: 'product_manager', en: 'Product Manager', ar: 'مدير منتج', group: 'Product Management', keywords: ['product', 'roadmap', 'agile', 'scrum'] },
  { code: 'project_manager', en: 'Project Manager', ar: 'مدير مشاريع', group: 'Operations & Admin', keywords: ['pmp', 'project', 'planning'] },
  { code: 'digital_marketer', en: 'Digital Marketing Specialist', ar: 'أخصائي تسويق رقمي', group: 'Marketing & Content', keywords: ['seo', 'marketing', 'social media', 'ads'] },
  { code: 'content_writer', en: 'Content Writer', ar: 'كاتب محتوى', group: 'Marketing & Content', keywords: ['writing', 'copywriting', 'content'] },
  { code: 'sales_exec', en: 'Sales Executive', ar: 'مسؤول مبيعات', group: 'Sales & Business', keywords: ['sales', 'b2b', 'crm'] },
  { code: 'business_dev', en: 'Business Development Manager', ar: 'مدير تطوير أعمال', group: 'Sales & Business', keywords: ['business development', 'partnerships'] },
  { code: 'accountant', en: 'Accountant', ar: 'محاسب', group: 'Finance & Accounting', keywords: ['accounting', 'ifrs', 'bookkeeping', 'cpa'] },
  { code: 'financial_analyst', en: 'Financial Analyst', ar: 'محلل مالي', group: 'Finance & Accounting', keywords: ['finance', 'modeling', 'cfa'] },
  { code: 'hr_specialist', en: 'HR Specialist', ar: 'أخصائي موارد بشرية', group: 'HR & Recruitment', keywords: ['hr', 'human resources', 'payroll'] },
  { code: 'recruiter', en: 'Recruiter', ar: 'مسؤول توظيف', group: 'HR & Recruitment', keywords: ['recruitment', 'talent', 'sourcing'] },
  { code: 'customer_support', en: 'Customer Support Specialist', ar: 'أخصائي دعم العملاء', group: 'Customer Support', keywords: ['support', 'customer service', 'call center'] },
  { code: 'nurse', en: 'Nurse', ar: 'ممرض', group: 'Healthcare', keywords: ['nursing', 'patient care'] },
  { code: 'physician', en: 'Physician', ar: 'طبيب', group: 'Healthcare', keywords: ['medicine', 'doctor', 'clinical'] },
  { code: 'civil_engineer', en: 'Civil Engineer', ar: 'مهندس مدني', group: 'Engineering', keywords: ['civil', 'autocad', 'construction'] },
  { code: 'mechanical_engineer', en: 'Mechanical Engineer', ar: 'مهندس ميكانيكي', group: 'Engineering', keywords: ['mechanical', 'solidworks'] },
  { code: 'electrical_engineer', en: 'Electrical Engineer', ar: 'مهندس كهربائي', group: 'Engineering', keywords: ['electrical', 'power'] },
  { code: 'operations_manager', en: 'Operations Manager', ar: 'مدير عمليات', group: 'Operations & Admin', keywords: ['operations', 'logistics', 'supply chain'] },
  { code: 'admin_assistant', en: 'Administrative Assistant', ar: 'مساعد إداري', group: 'Operations & Admin', keywords: ['admin', 'office', 'secretary'] },
];

const BY_CODE = new Map(EXPERTISE_TAXONOMY.map((e) => [e.code, e]));

export function expertiseLabel(code: string, lang: string): string {
  const e = BY_CODE.get(code);
  return e ? (lang.startsWith('ar') ? e.ar : e.en) : code;
}

/** Maps a legacy free-text title or onboarding group ("Software Development") to taxonomy codes. */
export function mapLegacyRole(raw: string): string[] {
  const k = raw.trim().toLowerCase();
  if (!k) return [];
  if (BY_CODE.has(k)) return [k];
  const exact = EXPERTISE_TAXONOMY.find((e) => e.en.toLowerCase() === k || e.ar === raw.trim());
  if (exact) return [exact.code];
  const group = EXPERTISE_TAXONOMY.filter((e) => e.group.toLowerCase() === k);
  if (group.length) return group.slice(0, 2).map((e) => e.code);
  const fuzzy = EXPERTISE_TAXONOMY.find((e) => k.includes(e.en.toLowerCase().split(' ')[0]) || e.keywords.some((w) => k.includes(w)));
  return fuzzy ? [fuzzy.code] : [];
}

export function searchExpertise(query: string, lang: string): ExpertiseItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXPERTISE_TAXONOMY;
  return EXPERTISE_TAXONOMY.filter((e) =>
    e.en.toLowerCase().includes(q) || e.ar.includes(query.trim()) || e.group.toLowerCase().includes(q) || e.keywords.some((w) => w.includes(q)) || expertiseLabel(e.code, lang).toLowerCase().includes(q));
}

/** Suggests expertise from skills, experience titles and education fields. Suggestions are never auto-applied. */
export function suggestExpertise(signals: { skills: string[]; titles: string[]; fields: string[] }, exclude: string[] = [], limit = 5): { code: string; score: number }[] {
  const text = [...signals.skills, ...signals.titles, ...signals.fields].map((s) => s.toLowerCase());
  const scored = EXPERTISE_TAXONOMY.map((e) => {
    let score = 0;
    for (const s of text) {
      if (s.includes(e.en.toLowerCase())) score += 3;
      for (const w of e.keywords) if (s.includes(w)) score += 1;
    }
    return { code: e.code, score };
  });
  return scored.filter((s) => s.score > 0 && !exclude.includes(s.code)).sort((a, b) => b.score - a.score).slice(0, limit);
}

export interface JobPreferences {
  expertise: string[];
  employmentTypes: EmploymentTypeCode[];
  industries: string[];
  locations: string[];
  salaryMin: string;
  salaryMax: string;
  willingToRelocate: boolean;
}

export const EMPTY_PREFERENCES: JobPreferences = {
  expertise: [], employmentTypes: [], industries: [], locations: [], salaryMin: '', salaryMax: '', willingToRelocate: false,
};

const key = (userId: string) => `matchme-job-preferences:${userId || 'anonymous'}`;

interface LegacyShape { titles?: string; type?: string; desired_roles?: string[]; work_styles?: string[]; industries?: string | string[]; locations?: string | string[] }

/** Converts any older preference/onboarding shape into the canonical record without losing values. */
export function migrateLegacyPreferences(raw: LegacyShape & Partial<JobPreferences>): JobPreferences {
  const split = (v?: string | string[]) => (Array.isArray(v) ? v : (v ?? '').split(',')).map((s) => s.trim()).filter(Boolean);
  const expertise = new Set<string>(raw.expertise ?? []);
  split(raw.titles).concat(raw.desired_roles ?? []).forEach((r) => mapLegacyRole(r).forEach((c) => expertise.add(c)));
  const types = new Set<EmploymentTypeCode>((raw.employmentTypes ?? []).filter((t) => (EMPLOYMENT_TYPES as readonly string[]).includes(t)));
  [raw.type, ...(raw.work_styles ?? [])].forEach((t) => { const n = normalizeEmploymentType(t); if (n) types.add(n); });
  return {
    ...EMPTY_PREFERENCES, ...raw,
    expertise: [...expertise], employmentTypes: [...types],
    industries: split(raw.industries), locations: split(raw.locations),
    salaryMin: String(raw.salaryMin ?? ''), salaryMax: String(raw.salaryMax ?? ''),
    willingToRelocate: !!raw.willingToRelocate,
  };
}

export function loadPreferences(userId: string): JobPreferences {
  try {
    const stored = localStorage.getItem(key(userId));
    if (stored) return migrateLegacyPreferences(JSON.parse(stored));
    const ob = JSON.parse(localStorage.getItem('matchme-onboarding') || 'null');
    const draft = ob?.state?.draft ?? ob?.draft;
    const owner = ob?.state?.userId ?? ob?.userId;
    if (draft && (!owner || owner === userId)) return migrateLegacyPreferences(draft);
  } catch { /* corrupt storage falls back to empty */ }
  return { ...EMPTY_PREFERENCES };
}

export function savePreferences(userId: string, prefs: JobPreferences): void {
  localStorage.setItem(key(userId), JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent('matchme:preferences-changed'));
}

/** Soft 0..1 preference fit used as a weighted ranking signal, never a hard filter. */
export function preferenceFit(prefs: JobPreferences, job: { title: string; employmentType?: string; skills?: string[] }): number {
  if (!prefs.expertise.length && !prefs.employmentTypes.length) return 0.5;
  const title = job.title.toLowerCase();
  const role = prefs.expertise.some((c) => {
    const e = BY_CODE.get(c);
    return !!e && (title.includes(e.en.toLowerCase().split(' ')[0]) || e.keywords.some((w) => title.includes(w) || (job.skills ?? []).some((s) => s.toLowerCase().includes(w))));
  });
  const type = normalizeEmploymentType(job.employmentType);
  const typeOk = !prefs.employmentTypes.length || (!!type && prefs.employmentTypes.includes(type));
  return (prefs.expertise.length ? (role ? 0.7 : 0.1) : 0.35) + (typeOk ? 0.3 : 0);
}
