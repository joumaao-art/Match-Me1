/**
 * Feature Registry Engine — Platform Infrastructure
 * 
 * Single source of truth for ALL platform features.
 * Enables:
 * - Feature discovery & documentation
 * - Platform parity validation (mobile vs desktop)
 * - Feature gating by subscription tier
 * - Role-based feature access
 * - Feature health monitoring
 * - Automated parity reports
 * 
 * Architecture:
 * - Declarative feature definitions (config-over-code)
 * - Composable feature groups
 * - Runtime validation engine
 * - Parity scoring system
 */

// ============================================================
// Types & Interfaces
// ============================================================

export type Platform = 'web_mobile' | 'web_desktop' | 'native_android' | 'native_ios';
export type UserRole = 'job_seeker' | 'company' | 'admin' | 'guest';
export type SubscriptionTier = 'free' | 'premium' | 'premium_plus' | 'enterprise';
export type FeatureStatus = 'active' | 'beta' | 'planned' | 'deprecated' | 'disabled';
export type FeatureCategory =
  | 'auth'
  | 'profile'
  | 'discovery'
  | 'matching'
  | 'messaging'
  | 'analytics'
  | 'subscription'
  | 'settings'
  | 'navigation'
  | 'notifications'
  | 'collections'
  | 'admin'
  | 'ai'
  | 'social'
  | 'payments';

export interface PlatformSupport {
  platform: Platform;
  status: FeatureStatus;
  /** Implementation quality: 0-100 */
  quality: number;
  /** Known limitations on this platform */
  limitations?: string[];
  /** Component/route implementing this feature */
  implementedIn?: string;
}

export interface FeatureDefinition {
  /** Unique feature identifier (kebab-case) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Brief description */
  description: string;
  /** Feature category for grouping */
  category: FeatureCategory;
  /** Which roles can access this feature */
  roles: UserRole[];
  /** Minimum subscription tier required */
  minTier: SubscriptionTier;
  /** Platform support matrix */
  platforms: PlatformSupport[];
  /** Dependencies on other features */
  dependencies?: string[];
  /** i18n key for the feature label */
  i18nKey?: string;
  /** Route path where feature is accessible */
  route?: string;
  /** Priority for parity work (1=critical, 5=nice-to-have) */
  parityPriority?: 1 | 2 | 3 | 4 | 5;
  /** Tags for filtering */
  tags?: string[];
  /** Date feature was added */
  addedDate?: string;
  /** Engineering owner */
  owner?: string;
}

export interface ParityReport {
  timestamp: string;
  totalFeatures: number;
  platformScores: Record<Platform, PlatformScore>;
  gaps: ParityGap[];
  recommendations: string[];
}

export interface PlatformScore {
  platform: Platform;
  totalSupported: number;
  activeCount: number;
  betaCount: number;
  plannedCount: number;
  averageQuality: number;
  /** 0-100 overall parity score */
  parityScore: number;
}

export interface ParityGap {
  featureId: string;
  featureName: string;
  category: FeatureCategory;
  referencePlatform: Platform;
  targetPlatform: Platform;
  referenceStatus: FeatureStatus;
  targetStatus: FeatureStatus | 'missing';
  qualityDelta: number;
  priority: number;
  recommendation: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  featureId: string;
  type: 'missing_platform' | 'circular_dependency' | 'invalid_tier' | 'orphan_dependency';
  message: string;
}

export interface ValidationWarning {
  featureId: string;
  type: 'low_quality' | 'no_route' | 'no_i18n' | 'deprecated_dependency';
  message: string;
}

// ============================================================
// Feature Registry Class
// ============================================================

class FeatureRegistryEngine {
  private features: Map<string, FeatureDefinition> = new Map();
  private listeners: Set<() => void> = new Set();

  // --- Registration ---

  register(feature: FeatureDefinition): void {
    if (this.features.has(feature.id)) {
      console.warn(`[FeatureRegistry] Feature "${feature.id}" already registered. Overwriting.`);
    }
    this.features.set(feature.id, feature);
    this.notify();
  }

  registerBatch(features: FeatureDefinition[]): void {
    features.forEach(f => this.features.set(f.id, f));
    this.notify();
  }

  unregister(featureId: string): boolean {
    const deleted = this.features.delete(featureId);
    if (deleted) this.notify();
    return deleted;
  }

  // --- Querying ---

  get(featureId: string): FeatureDefinition | undefined {
    return this.features.get(featureId);
  }

  getAll(): FeatureDefinition[] {
    return Array.from(this.features.values());
  }

  getByCategory(category: FeatureCategory): FeatureDefinition[] {
    return this.getAll().filter(f => f.category === category);
  }

  getByRole(role: UserRole): FeatureDefinition[] {
    return this.getAll().filter(f => f.roles.includes(role));
  }

  getByTier(tier: SubscriptionTier): FeatureDefinition[] {
    const tierOrder: SubscriptionTier[] = ['free', 'premium', 'premium_plus', 'enterprise'];
    const tierIndex = tierOrder.indexOf(tier);
    return this.getAll().filter(f => tierOrder.indexOf(f.minTier) <= tierIndex);
  }

  getByPlatform(platform: Platform, status?: FeatureStatus): FeatureDefinition[] {
    return this.getAll().filter(f =>
      f.platforms.some(p => p.platform === platform && (!status || p.status === status))
    );
  }

  getByTag(tag: string): FeatureDefinition[] {
    return this.getAll().filter(f => f.tags?.includes(tag));
  }

  search(query: string): FeatureDefinition[] {
    const q = query.toLowerCase();
    return this.getAll().filter(f =>
      f.id.includes(q) ||
      f.name.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags?.some(t => t.includes(q))
    );
  }

  // --- Feature Access Check ---

  canAccess(featureId: string, role: UserRole, tier: SubscriptionTier): boolean {
    const feature = this.get(featureId);
    if (!feature) return false;
    if (!feature.roles.includes(role)) return false;
    const tierOrder: SubscriptionTier[] = ['free', 'premium', 'premium_plus', 'enterprise'];
    return tierOrder.indexOf(tier) >= tierOrder.indexOf(feature.minTier);
  }

  isAvailableOn(featureId: string, platform: Platform): boolean {
    const feature = this.get(featureId);
    if (!feature) return false;
    return feature.platforms.some(p => p.platform === platform && (p.status === 'active' || p.status === 'beta'));
  }

  // --- Validation Engine ---

  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const feature of this.getAll()) {
      // Check circular dependencies
      if (feature.dependencies) {
        for (const depId of feature.dependencies) {
          const dep = this.get(depId);
          if (!dep) {
            errors.push({
              featureId: feature.id,
              type: 'orphan_dependency',
              message: `Feature "${feature.id}" depends on "${depId}" which is not registered.`,
            });
          } else if (dep.dependencies?.includes(feature.id)) {
            errors.push({
              featureId: feature.id,
              type: 'circular_dependency',
              message: `Circular dependency between "${feature.id}" and "${depId}".`,
            });
          }
        }
      }

      // Check platform coverage
      const platforms: Platform[] = ['web_mobile', 'web_desktop', 'native_android', 'native_ios'];
      const supportedPlatforms = feature.platforms.map(p => p.platform);
      const missingPlatforms = platforms.filter(p => !supportedPlatforms.includes(p));
      if (missingPlatforms.length > 0 && feature.category !== 'admin') {
        // Admin features don't need mobile
        for (const mp of missingPlatforms) {
          if (mp === 'native_android' || mp === 'native_ios') continue; // Native optional
          warnings.push({
            featureId: feature.id,
            type: 'low_quality',
            message: `Feature "${feature.id}" missing platform support for "${mp}".`,
          });
        }
      }

      // Check quality thresholds
      for (const ps of feature.platforms) {
        if (ps.status === 'active' && ps.quality < 50) {
          warnings.push({
            featureId: feature.id,
            type: 'low_quality',
            message: `Feature "${feature.id}" on "${ps.platform}" has low quality score (${ps.quality}/100).`,
          });
        }
      }

      // Check i18n
      if (!feature.i18nKey) {
        warnings.push({
          featureId: feature.id,
          type: 'no_i18n',
          message: `Feature "${feature.id}" has no i18n key defined.`,
        });
      }

      // Check route
      if (!feature.route && feature.category !== 'ai' && feature.category !== 'notifications') {
        warnings.push({
          featureId: feature.id,
          type: 'no_route',
          message: `Feature "${feature.id}" has no route defined.`,
        });
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // --- Parity Analysis ---

  generateParityReport(referencePlatform: Platform = 'web_desktop'): ParityReport {
    const allFeatures = this.getAll();
    const platforms: Platform[] = ['web_mobile', 'web_desktop', 'native_android', 'native_ios'];
    const platformScores: Record<string, PlatformScore> = {};
    const gaps: ParityGap[] = [];

    for (const platform of platforms) {
      const supported = allFeatures.filter(f =>
        f.platforms.some(p => p.platform === platform)
      );
      const active = supported.filter(f =>
        f.platforms.find(p => p.platform === platform)?.status === 'active'
      );
      const beta = supported.filter(f =>
        f.platforms.find(p => p.platform === platform)?.status === 'beta'
      );
      const planned = supported.filter(f =>
        f.platforms.find(p => p.platform === platform)?.status === 'planned'
      );

      const qualities = supported
        .map(f => f.platforms.find(p => p.platform === platform)?.quality || 0)
        .filter(q => q > 0);
      const avgQuality = qualities.length > 0
        ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length)
        : 0;

      const parityScore = allFeatures.length > 0
        ? Math.round(((active.length + beta.length * 0.5) / allFeatures.length) * 100)
        : 0;

      platformScores[platform] = {
        platform,
        totalSupported: supported.length,
        activeCount: active.length,
        betaCount: beta.length,
        plannedCount: planned.length,
        averageQuality: avgQuality,
        parityScore,
      };
    }

    // Find gaps relative to reference platform
    for (const feature of allFeatures) {
      const refSupport = feature.platforms.find(p => p.platform === referencePlatform);
      if (!refSupport || refSupport.status === 'disabled') continue;

      for (const platform of platforms) {
        if (platform === referencePlatform) continue;
        if (platform === 'native_android' || platform === 'native_ios') continue; // Skip native for now

        const targetSupport = feature.platforms.find(p => p.platform === platform);

        if (!targetSupport) {
          gaps.push({
            featureId: feature.id,
            featureName: feature.name,
            category: feature.category,
            referencePlatform,
            targetPlatform: platform,
            referenceStatus: refSupport.status,
            targetStatus: 'missing',
            qualityDelta: refSupport.quality,
            priority: feature.parityPriority || 3,
            recommendation: `Implement "${feature.name}" on ${platform}`,
          });
        } else if (targetSupport.quality < refSupport.quality - 20) {
          gaps.push({
            featureId: feature.id,
            featureName: feature.name,
            category: feature.category,
            referencePlatform,
            targetPlatform: platform,
            referenceStatus: refSupport.status,
            targetStatus: targetSupport.status,
            qualityDelta: refSupport.quality - targetSupport.quality,
            priority: feature.parityPriority || 3,
            recommendation: `Improve "${feature.name}" quality on ${platform} (${targetSupport.quality} → ${refSupport.quality})`,
          });
        }
      }
    }

    // Sort gaps by priority then quality delta
    gaps.sort((a, b) => a.priority - b.priority || b.qualityDelta - a.qualityDelta);

    const recommendations = gaps.slice(0, 5).map(g => g.recommendation);

    return {
      timestamp: new Date().toISOString(),
      totalFeatures: allFeatures.length,
      platformScores: platformScores as Record<Platform, PlatformScore>,
      gaps,
      recommendations,
    };
  }

  // --- Statistics ---

  getStats() {
    const all = this.getAll();
    const categories = new Map<FeatureCategory, number>();
    const roles = new Map<UserRole, number>();
    const tiers = new Map<SubscriptionTier, number>();

    for (const f of all) {
      categories.set(f.category, (categories.get(f.category) || 0) + 1);
      for (const r of f.roles) roles.set(r, (roles.get(r) || 0) + 1);
      tiers.set(f.minTier, (tiers.get(f.minTier) || 0) + 1);
    }

    return {
      total: all.length,
      byCategory: Object.fromEntries(categories),
      byRole: Object.fromEntries(roles),
      byTier: Object.fromEntries(tiers),
      activeOnMobile: all.filter(f => f.platforms.some(p => p.platform === 'web_mobile' && p.status === 'active')).length,
      activeOnDesktop: all.filter(f => f.platforms.some(p => p.platform === 'web_desktop' && p.status === 'active')).length,
    };
  }

  // --- Subscription ---

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  // --- Export ---

  toJSON(): object {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      features: this.getAll(),
    };
  }
}

// ============================================================
// Singleton Instance
// ============================================================

export const featureRegistry = new FeatureRegistryEngine();

// ============================================================
// Default Feature Registrations — MatchMe Platform
// ============================================================

const defaultFeatures: FeatureDefinition[] = [
  // --- Auth ---
  {
    id: 'auth-login',
    name: 'User Login',
    description: 'Email/password authentication with remember me',
    category: 'auth',
    roles: ['job_seeker', 'company', 'admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 95, implementedIn: 'src/pages/Auth.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/pages/Auth.tsx' },
    ],
    i18nKey: 'login',
    route: '/auth',
    parityPriority: 1,
    tags: ['core', 'security'],
    addedDate: '2026-07-17',
  },
  {
    id: 'auth-register',
    name: 'User Registration',
    description: 'Role-based sign-up (job seeker or company)',
    category: 'auth',
    roles: ['guest'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 95, implementedIn: 'src/pages/Auth.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/pages/Auth.tsx' },
    ],
    i18nKey: 'sign_up',
    route: '/auth',
    parityPriority: 1,
    tags: ['core', 'onboarding'],
    addedDate: '2026-07-17',
  },
  {
    id: 'auth-password-reset',
    name: 'Password Reset',
    description: 'Forgot password flow with email verification',
    category: 'auth',
    roles: ['job_seeker', 'company', 'admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/Auth.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 85, implementedIn: 'src/pages/Auth.tsx' },
    ],
    i18nKey: 'forgot_password',
    route: '/auth',
    parityPriority: 2,
    tags: ['security'],
    addedDate: '2026-07-17',
  },

  // --- Discovery ---
  {
    id: 'discovery-swipe',
    name: 'Swipe Discovery',
    description: 'Tinder-style swipe cards for job/candidate discovery with AI matching',
    category: 'discovery',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85, implementedIn: 'src/pages/JobSeeker.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 95, implementedIn: 'src/pages/JobSeeker.tsx' },
    ],
    i18nKey: 'discover',
    route: '/seeker',
    parityPriority: 1,
    tags: ['core', 'engagement', 'mobile-first'],
    addedDate: '2026-07-17',
  },
  {
    id: 'discovery-ai-matching',
    name: 'AI Matching Engine',
    description: 'AI-powered compatibility scoring with multi-factor analysis',
    category: 'ai',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/lib/ai-matching.ts' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/lib/ai-matching.ts' },
    ],
    i18nKey: 'ai_matching',
    parityPriority: 1,
    tags: ['core', 'ai', 'differentiation'],
    addedDate: '2026-07-17',
  },
  {
    id: 'discovery-search-filter',
    name: 'Search & Filter',
    description: 'Advanced search with multi-criteria filtering',
    category: 'discovery',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85, implementedIn: 'src/pages/Company.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 60, limitations: ['Limited filter UI on small screens', 'No saved searches on mobile'] },
    ],
    i18nKey: 'search',
    route: '/company',
    parityPriority: 2,
    tags: ['discovery', 'productivity'],
    addedDate: '2026-07-17',
  },

  // --- Profile ---
  {
    id: 'profile-edit',
    name: 'Profile Editor',
    description: 'Full profile editing with sections (experience, education, skills, etc.)',
    category: 'profile',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/JobSeeker.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 75, limitations: ['Section navigation harder on mobile', 'No drag-to-reorder'] },
    ],
    i18nKey: 'profile',
    route: '/seeker',
    parityPriority: 2,
    tags: ['core', 'onboarding'],
    addedDate: '2026-07-17',
  },
  {
    id: 'profile-visibility',
    name: 'Profile Visibility Controls',
    description: 'Privacy settings: public, limited, or hidden profile',
    category: 'profile',
    roles: ['job_seeker'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85, implementedIn: 'src/pages/JobSeeker.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 80, implementedIn: 'src/components/shared/MobileAccountCenter.tsx' },
    ],
    i18nKey: 'profile_visibility',
    parityPriority: 3,
    tags: ['privacy', 'premium'],
    addedDate: '2026-07-18',
  },
  {
    id: 'profile-video-intro',
    name: 'Video Introduction',
    description: 'Record or upload a video introduction for your profile',
    category: 'profile',
    roles: ['job_seeker'],
    minTier: 'premium',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 75 },
      { platform: 'web_mobile', status: 'planned', quality: 0, limitations: ['Camera API integration pending'] },
    ],
    i18nKey: 'video_intro',
    parityPriority: 4,
    tags: ['premium', 'engagement'],
    addedDate: '2026-07-18',
  },

  // --- Matching ---
  {
    id: 'matching-engine',
    name: 'Matching Engine',
    description: 'Core swipe matching with mutual interest detection',
    category: 'matching',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/lib/matching-engine.ts' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/lib/matching-engine.ts' },
    ],
    i18nKey: 'matches',
    route: '/seeker',
    parityPriority: 1,
    tags: ['core'],
    addedDate: '2026-07-17',
  },
  {
    id: 'matching-undo',
    name: 'Undo Last Swipe',
    description: 'Undo the most recent swipe decision',
    category: 'matching',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85 },
      { platform: 'web_mobile', status: 'active', quality: 85 },
    ],
    i18nKey: 'undo_last_swipe',
    parityPriority: 3,
    tags: ['ux'],
    addedDate: '2026-07-19',
  },

  // --- Messaging ---
  {
    id: 'messaging-inbox',
    name: 'Messages Inbox',
    description: 'Real-time messaging between matched users',
    category: 'messaging',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85, implementedIn: 'src/pages/Messages.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 80, implementedIn: 'src/pages/Messages.tsx' },
    ],
    i18nKey: 'messages',
    route: '/messages',
    parityPriority: 1,
    tags: ['core', 'engagement'],
    addedDate: '2026-07-17',
  },

  // --- Dashboard ---
  {
    id: 'dashboard-stats',
    name: 'Dashboard Statistics',
    description: 'Overview stats cards (views, matches, applications, etc.)',
    category: 'analytics',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/JobSeeker.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/pages/JobSeeker.tsx' },
    ],
    i18nKey: 'dashboard',
    route: '/seeker',
    parityPriority: 2,
    tags: ['analytics', 'card-engine'],
    addedDate: '2026-07-17',
  },
  {
    id: 'dashboard-exposure',
    name: 'Exposure Analytics',
    description: 'Profile view analytics, who viewed you, trending metrics',
    category: 'analytics',
    roles: ['job_seeker'],
    minTier: 'premium',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 80 },
      { platform: 'web_mobile', status: 'active', quality: 70, limitations: ['Charts less readable on small screens'] },
    ],
    i18nKey: 'exposure_dashboard',
    parityPriority: 3,
    tags: ['premium', 'analytics'],
    addedDate: '2026-07-18',
  },

  // --- Subscription & Payments ---
  {
    id: 'subscription-plans',
    name: 'Subscription Plans',
    description: 'View and manage subscription tiers (Free/Premium/Premium+)',
    category: 'subscription',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/Subscription.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 70, limitations: ['Plan comparison table cramped', 'Payment flow not mobile-optimized'] },
    ],
    i18nKey: 'subscription',
    route: '/seeker/subscription',
    parityPriority: 2,
    tags: ['monetization', 'billing'],
    addedDate: '2026-07-18',
  },
  {
    id: 'subscription-billing',
    name: 'Billing & Invoices',
    description: 'Payment history, invoices, billing management',
    category: 'payments',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85 },
      { platform: 'web_mobile', status: 'active', quality: 60, limitations: ['Invoice table not responsive', 'Download buttons small'] },
    ],
    i18nKey: 'billing',
    parityPriority: 3,
    tags: ['monetization', 'billing'],
    addedDate: '2026-07-18',
  },

  // --- Settings ---
  {
    id: 'settings-password',
    name: 'Change Password',
    description: 'Update account password with strength indicator',
    category: 'settings',
    roles: ['job_seeker', 'company', 'admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90 },
      { platform: 'web_mobile', status: 'active', quality: 85 },
    ],
    i18nKey: 'change_password',
    parityPriority: 3,
    tags: ['security'],
    addedDate: '2026-07-17',
  },
  {
    id: 'settings-notifications',
    name: 'Notification Preferences',
    description: 'Configure notification channels and frequency',
    category: 'notifications',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 80 },
      { platform: 'web_mobile', status: 'active', quality: 75 },
    ],
    i18nKey: 'notifications',
    parityPriority: 3,
    tags: ['engagement'],
    addedDate: '2026-07-18',
  },
  {
    id: 'settings-language',
    name: 'Language Switching',
    description: 'Toggle between English and Arabic with full RTL support',
    category: 'settings',
    roles: ['job_seeker', 'company', 'admin', 'guest'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 95 },
      { platform: 'web_mobile', status: 'active', quality: 95 },
    ],
    i18nKey: 'language',
    parityPriority: 1,
    tags: ['i18n', 'accessibility'],
    addedDate: '2026-07-17',
  },
  {
    id: 'settings-dark-mode',
    name: 'Dark Mode',
    description: 'System/manual dark mode toggle',
    category: 'settings',
    roles: ['job_seeker', 'company', 'admin', 'guest'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90 },
      { platform: 'web_mobile', status: 'active', quality: 90 },
    ],
    i18nKey: 'dark_mode',
    parityPriority: 3,
    tags: ['accessibility', 'ux'],
    addedDate: '2026-07-17',
  },

  // --- Navigation ---
  {
    id: 'nav-bottom-bar',
    name: 'Mobile Bottom Navigation',
    description: 'Native-style bottom tab bar with badges and haptic feedback',
    category: 'navigation',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_mobile', status: 'active', quality: 95, implementedIn: 'src/components/shared/MobileBottomNav.tsx' },
      { platform: 'web_desktop', status: 'disabled', quality: 0 },
    ],
    i18nKey: 'main_navigation',
    parityPriority: 1,
    tags: ['mobile-first', 'navigation'],
    addedDate: '2026-07-19',
  },
  {
    id: 'nav-account-center',
    name: 'Mobile Account Center',
    description: 'Dedicated mobile account page with grouped sections',
    category: 'navigation',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/components/shared/MobileAccountCenter.tsx' },
      { platform: 'web_desktop', status: 'disabled', quality: 0 },
    ],
    i18nKey: 'account',
    parityPriority: 2,
    tags: ['mobile-first', 'navigation'],
    addedDate: '2026-08-06',
  },
  {
    id: 'nav-decision-action-bar',
    name: 'Decision Action Bar',
    description: 'Sticky Pass/Save/Like action bar for swipe screens',
    category: 'navigation',
    roles: ['job_seeker', 'company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/components/shared/DecisionActionBar.tsx' },
      { platform: 'web_desktop', status: 'active', quality: 85, implementedIn: 'src/components/shared/DecisionActionBar.tsx' },
    ],
    i18nKey: 'discover',
    parityPriority: 1,
    tags: ['mobile-first', 'engagement'],
    addedDate: '2026-08-06',
  },

  // --- Collections ---
  {
    id: 'collections-saved-candidates',
    name: 'Saved Candidates Collections',
    description: 'Organize candidates into manual/smart/AI/shared collections',
    category: 'collections',
    roles: ['company'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/components/shared/CollectionEngine.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 70, limitations: ['Grid layout cramped', 'Bulk actions harder to reach'] },
    ],
    i18nKey: 'saved_candidates',
    route: '/company',
    parityPriority: 3,
    tags: ['productivity', 'collections'],
    addedDate: '2026-07-19',
  },
  {
    id: 'collections-saved-jobs',
    name: 'Saved Jobs',
    description: 'Bookmark and organize saved job listings',
    category: 'collections',
    roles: ['job_seeker'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 80 },
      { platform: 'web_mobile', status: 'active', quality: 75 },
    ],
    i18nKey: 'saved_jobs',
    parityPriority: 3,
    tags: ['productivity'],
    addedDate: '2026-07-17',
  },

  // --- Card Engine ---
  {
    id: 'card-engine',
    name: 'Universal Card Engine',
    description: 'Config-driven card rendering system (10 templates)',
    category: 'analytics',
    roles: ['job_seeker', 'company', 'admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 95, implementedIn: 'src/components/shared/CardEngine.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 90, implementedIn: 'src/components/shared/CardEngine.tsx' },
    ],
    i18nKey: 'dashboard',
    parityPriority: 2,
    tags: ['platform-engine', 'reusable'],
    addedDate: '2026-08-06',
  },

  // --- Admin ---
  {
    id: 'admin-portal',
    name: 'Super Admin Portal',
    description: '15-section admin dashboard with full platform management',
    category: 'admin',
    roles: ['admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/Admin.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 60, limitations: ['Data tables not fully responsive', 'Complex forms difficult on mobile'] },
    ],
    i18nKey: 'admin_panel',
    route: '/admin',
    parityPriority: 5,
    tags: ['admin', 'internal'],
    addedDate: '2026-07-17',
  },
  {
    id: 'admin-analytics',
    name: 'Platform Analytics',
    description: '14 KPIs with charts, funnels, cohorts, and rankings',
    category: 'admin',
    roles: ['admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 90, implementedIn: 'src/pages/Analytics.tsx' },
      { platform: 'web_mobile', status: 'active', quality: 55, limitations: ['Charts too small', 'Heatmap unreadable'] },
    ],
    i18nKey: 'analytics',
    route: '/admin/analytics',
    parityPriority: 5,
    tags: ['admin', 'analytics'],
    addedDate: '2026-07-17',
  },
  {
    id: 'admin-localization',
    name: 'Localization Management',
    description: '7-tab translation management with editor, import/export, analytics',
    category: 'admin',
    roles: ['admin'],
    minTier: 'free',
    platforms: [
      { platform: 'web_desktop', status: 'active', quality: 85 },
      { platform: 'web_mobile', status: 'active', quality: 50, limitations: ['Editor table not mobile-friendly'] },
    ],
    i18nKey: 'localization',
    route: '/admin',
    parityPriority: 5,
    tags: ['admin', 'i18n'],
    addedDate: '2026-07-19',
  },
];

// Register all default features
featureRegistry.registerBatch(defaultFeatures);

// ============================================================
// React Hook for Feature Registry
// ============================================================

import { useSyncExternalStore } from 'react';

export function useFeatureRegistry() {
  const subscribe = (callback: () => void) => featureRegistry.subscribe(callback);
  const getSnapshot = () => featureRegistry.getAll();

  const features = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    features,
    registry: featureRegistry,
    canAccess: featureRegistry.canAccess.bind(featureRegistry),
    isAvailableOn: featureRegistry.isAvailableOn.bind(featureRegistry),
    validate: featureRegistry.validate.bind(featureRegistry),
    generateParityReport: featureRegistry.generateParityReport.bind(featureRegistry),
    getStats: featureRegistry.getStats.bind(featureRegistry),
    getByCategory: featureRegistry.getByCategory.bind(featureRegistry),
    getByRole: featureRegistry.getByRole.bind(featureRegistry),
    search: featureRegistry.search.bind(featureRegistry),
  };
}

export default featureRegistry;