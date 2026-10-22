/**
 * PortalBrand - Universal Enterprise Branding Component
 * 
 * Standardized branding across all authenticated portals in MatchMe.
 * Supports 4-level hierarchy: App Name → Portal → Organization/Tenant → Environment
 * 
 * Features:
 * - Configuration-driven (no hardcoded values)
 * - Full i18n/RTL support
 * - Sidebar collapse support (logo-only with tooltip)
 * - Environment badges (Production/Staging/Development/Local)
 * - White-label ready
 * - Responsive (desktop/tablet/mobile)
 * - Accessible (ARIA labels, screen readers, keyboard nav)
 * - Performance optimized (memo, single render)
 */

import { memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

// ============================================================
// Types & Configuration
// ============================================================

export type PortalType = 'company' | 'job_seeker' | 'admin' | 'agency' | 'university' | 'government' | 'white_label';
export type WorkspaceType = 'organization' | 'personal' | 'platform' | 'agency' | 'university' | 'government';
export type EnvironmentType = 'production' | 'staging' | 'development' | 'local';

export interface PortalBrandConfig {
  /** Application name (Level 1) - defaults to 'MatchMe' */
  appName?: string;
  /** Translation key for app name */
  appNameKey?: string;
  /** Portal type identifier */
  portalType: PortalType;
  /** Translation key for portal name (Level 2) */
  portalNameKey: string;
  /** Organization/Tenant/Workspace name (Level 3) */
  workspaceName?: string;
  /** Translation key for workspace name */
  workspaceNameKey?: string;
  /** Workspace type for contextual display */
  workspaceType?: WorkspaceType;
  /** Current environment (Level 4) */
  environment?: EnvironmentType;
  /** Custom logo element */
  logo?: ReactNode;
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Brand theme overrides for white-label */
  brandTheme?: {
    primaryColor?: string;
    logoBackground?: string;
    appNameColor?: string;
  };
}

// ============================================================
// Environment Configuration
// ============================================================

const ENVIRONMENT_CONFIG: Record<EnvironmentType, { colorClass: string; dotClass: string; visible: boolean }> = {
  production: { colorClass: 'text-green-600 dark:text-green-400', dotClass: 'bg-green-500', visible: false },
  staging: { colorClass: 'text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500', visible: true },
  development: { colorClass: 'text-red-600 dark:text-red-400', dotClass: 'bg-red-500', visible: true },
  local: { colorClass: 'text-gray-500 dark:text-gray-400', dotClass: 'bg-gray-400', visible: true },
};

const ENVIRONMENT_KEYS: Record<EnvironmentType, string> = {
  production: 'env_production',
  staging: 'env_staging',
  development: 'env_development',
  local: 'env_local',
};

// ============================================================
// Default Logo Component
// ============================================================

function DefaultLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div className={`${className} rounded-lg bg-primary flex items-center justify-center shrink-0`}>
      <Sparkles className="w-5 h-5 text-primary-foreground" />
    </div>
  );
}

// ============================================================
// Environment Badge
// ============================================================

function EnvironmentBadge({ environment, compact = false }: { environment: EnvironmentType; compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const config = ENVIRONMENT_CONFIG[environment];

  if (!config.visible && environment === 'production') return null;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'mt-1'}`} role="status" aria-label={t(ENVIRONMENT_KEYS[environment])}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass} animate-pulse`} />
      <span className={`text-[9px] font-medium uppercase tracking-wider ${config.colorClass}`}>
        {t(ENVIRONMENT_KEYS[environment])}
      </span>
    </div>
  );
}

// ============================================================
// Utility: Detect Environment
// ============================================================

export function detectEnvironment(): EnvironmentType {
  const mode = import.meta.env.MODE;
  const url = typeof window !== 'undefined' ? window.location.hostname : '';

  if (mode === 'development' || url === 'localhost' || url === '127.0.0.1') return 'development';
  if (url.includes('staging') || url.includes('stg')) return 'staging';
  if (url.includes('local') || url.endsWith('.local')) return 'local';
  return 'production';
}

// ============================================================
// Main PortalBrand Component
// ============================================================

const PortalBrand = memo(function PortalBrand({ config }: { config: PortalBrandConfig }) {
  const { t, i18n } = useTranslation();

  const appName = config.appNameKey ? t(config.appNameKey) : (config.appName || 'MatchMe');
  const portalName = t(config.portalNameKey);
  const workspaceName = config.workspaceNameKey ? t(config.workspaceNameKey) : config.workspaceName;
  const environment = config.environment || detectEnvironment();
  const logo = config.logo || <DefaultLogo />;

  // Collapsed state: show only logo with tooltip
  if (config.collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center justify-center py-3"
              role="banner"
              aria-label={`${appName} - ${portalName}${workspaceName ? ` - ${workspaceName}` : ''}`}
            >
              {logo}
            </div>
          </TooltipTrigger>
          <TooltipContent side={i18n.language === 'ar' ? 'left' : 'right'} className="space-y-0.5 p-3">
            <p className="text-sm font-bold font-[Poppins]">{appName}</p>
            <p className="text-xs text-muted-foreground">{portalName}</p>
            {workspaceName && <p className="text-[10px] text-muted-foreground">{workspaceName}</p>}
            <EnvironmentBadge environment={environment} compact />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded state: full branding hierarchy
  return (
    <div
      className="flex items-start gap-2.5"
      role="banner"
      aria-label={`${appName} - ${portalName}${workspaceName ? ` - ${workspaceName}` : ''}`}
    >
      {/* Logo */}
      <div className="shrink-0 mt-0.5">{logo}</div>

      {/* Text hierarchy */}
      <div className="min-w-0 flex-1">
        {/* Level 1: Application Name */}
        <p
          className="text-sm font-bold font-[Poppins] text-foreground truncate leading-tight"
          style={config.brandTheme?.appNameColor ? { color: config.brandTheme.appNameColor } : undefined}
        >
          {appName}
        </p>

        {/* Level 2: Portal Name */}
        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
          {portalName}
        </p>

        {/* Level 3: Organization / Workspace */}
        {workspaceName && (
          <p className="text-[10px] text-muted-foreground/70 truncate leading-tight mt-0.5">
            {workspaceName}
          </p>
        )}

        {/* Level 4: Environment Badge */}
        <EnvironmentBadge environment={environment} />
      </div>
    </div>
  );
});

export default PortalBrand;

// ============================================================
// Portal Configuration Presets
// ============================================================

export function getPortalBrandConfig(
  portalType: PortalType,
  options?: {
    organizationName?: string;
    collapsed?: boolean;
    environment?: EnvironmentType;
    logo?: ReactNode;
  }
): PortalBrandConfig {
  const baseConfig: Partial<PortalBrandConfig> = {
    appNameKey: 'app_name',
    collapsed: options?.collapsed,
    environment: options?.environment,
    logo: options?.logo,
  };

  switch (portalType) {
    case 'company':
      return {
        ...baseConfig,
        portalType: 'company',
        portalNameKey: 'portal_company',
        workspaceName: options?.organizationName,
        workspaceNameKey: options?.organizationName ? undefined : undefined,
        workspaceType: 'organization',
      };
    case 'job_seeker':
      return {
        ...baseConfig,
        portalType: 'job_seeker',
        portalNameKey: 'portal_job_seeker',
        workspaceNameKey: 'portal_workspace_personal',
        workspaceType: 'personal',
      };
    case 'admin':
      return {
        ...baseConfig,
        portalType: 'admin',
        portalNameKey: 'portal_super_admin',
        workspaceNameKey: 'portal_workspace_platform',
        workspaceType: 'platform',
      };
    case 'agency':
      return {
        ...baseConfig,
        portalType: 'agency',
        portalNameKey: 'portal_agency',
        workspaceName: options?.organizationName,
        workspaceType: 'agency',
      };
    case 'university':
      return {
        ...baseConfig,
        portalType: 'university',
        portalNameKey: 'portal_university',
        workspaceName: options?.organizationName,
        workspaceType: 'university',
      };
    case 'government':
      return {
        ...baseConfig,
        portalType: 'government',
        portalNameKey: 'portal_government',
        workspaceName: options?.organizationName,
        workspaceType: 'government',
      };
    case 'white_label':
      return {
        ...baseConfig,
        portalType: 'white_label',
        portalNameKey: 'portal_white_label',
        workspaceName: options?.organizationName,
        workspaceType: 'organization',
      };
    default:
      return {
        ...baseConfig,
        portalType: 'company',
        portalNameKey: 'portal_company',
        workspaceName: options?.organizationName,
        workspaceType: 'organization',
      };
  }
}