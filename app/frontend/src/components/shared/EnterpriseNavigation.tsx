/**
 * Enterprise Navigation Framework
 * 
 * A shared, configuration-driven navigation system used across all MatchMe portals:
 * - Company Portal
 * - Job Seeker Portal  
 * - Super Admin Platform
 * 
 * Features:
 * - Collapsible accordion sections with smooth animations
 * - Permission-based visibility
 * - Feature flag support
 * - Subscription-based menu items
 * - State persistence (localStorage)
 * - RTL/LTR support
 * - Keyboard accessibility (ARIA)
 * - Mobile slide-out drawer
 * - Configuration-driven (no hardcoded menus)
 */

import { useState, useCallback, useMemo, useEffect, memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, LogOut, Globe, Moon, Sun, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { changeLanguage } from '@/lib/i18n';

// ============================================================
// Types & Configuration
// ============================================================

export interface NavItemConfig {
  id: string;
  titleKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  route?: string;
  permission?: string;
  featureFlag?: string;
  subscriptionTier?: string[];
  badge?: number | string;
  children?: NavItemConfig[];
  separator?: boolean;
}

export interface NavSectionConfig {
  id: string;
  titleKey: string;
  icon?: React.ComponentType<{ className?: string }>;
  permission?: string;
  featureFlag?: string;
  subscriptionTier?: string[];
  items: NavItemConfig[];
}

export interface NavigationConfig {
  portalId: string;
  logo?: ReactNode;
  title: string;
  subtitle?: string;
  sections: NavSectionConfig[];
  footerActions?: ReactNode;
}

export interface NavigationContext {
  permissions?: string[];
  featureFlags?: Record<string, boolean>;
  subscriptionTier?: string;
  role?: string;
}

interface EnterpriseNavigationProps {
  config: NavigationConfig;
  context?: NavigationContext;
  activeItemId: string;
  onNavigate: (itemId: string) => void;
  onSignOut?: () => void;
}

// ============================================================
// Utility: Persistence
// ============================================================

function getPersistedState(portalId: string): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(`matchme_nav_${portalId}`);
    return stored ? JSON.parse(stored) : {};
  } catch (_e) { return {}; }
}

function persistState(portalId: string, state: Record<string, boolean>) {
  try { localStorage.setItem(`matchme_nav_${portalId}`, JSON.stringify(state)); } catch (_e) { /* storage unavailable */ }
}

// ============================================================
// Utility: Visibility Guards
// ============================================================

function isItemVisible(item: { permission?: string; featureFlag?: string; subscriptionTier?: string[] }, context?: NavigationContext): boolean {
  if (!context) return true;
  if (item.permission && context.permissions && !context.permissions.includes(item.permission)) return false;
  if (item.featureFlag && context.featureFlags && !context.featureFlags[item.featureFlag]) return false;
  if (item.subscriptionTier && item.subscriptionTier.length > 0 && context.subscriptionTier && !item.subscriptionTier.includes(context.subscriptionTier)) return false;
  return true;
}

function isSectionVisible(section: NavSectionConfig, context?: NavigationContext): boolean {
  if (!isItemVisible(section, context)) return false;
  return section.items.some(item => isItemVisible(item, context));
}

// ============================================================
// Component: NavigationAccordion
// ============================================================

const NavigationAccordion = memo(function NavigationAccordion({
  section,
  isExpanded,
  onToggle,
  activeItemId,
  onNavigate,
  context,
}: {
  section: NavSectionConfig;
  isExpanded: boolean;
  onToggle: () => void;
  activeItemId: string;
  onNavigate: (id: string) => void;
  context?: NavigationContext;
}) {
  const { t } = useTranslation();
  const visibleItems = useMemo(() => section.items.filter(item => isItemVisible(item, context)), [section.items, context]);
  const hasActiveChild = useMemo(() => visibleItems.some(item => item.id === activeItemId || item.children?.some(c => c.id === activeItemId)), [visibleItems, activeItemId]);
  const SectionIcon = section.icon;

  if (visibleItems.length === 0) return null;

  // Single item sections render as direct nav item (no accordion)
  if (visibleItems.length === 1 && !visibleItems[0].children) {
    const item = visibleItems[0];
    const ItemIcon = item.icon;
    const isActive = item.id === activeItemId;
    return (
      <button
        onClick={() => onNavigate(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {ItemIcon && <ItemIcon className="w-4 h-4 shrink-0" />}
        <span className="truncate">{t(item.titleKey)}</span>
        {item.badge && <Badge variant="secondary" className="ms-auto text-[10px] h-5 min-w-5 justify-center">{item.badge}</Badge>}
      </button>
    );
  }

  return (
    <div className="space-y-0.5">
      {/* Accordion Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer group ${hasActiveChild ? 'text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
        aria-expanded={isExpanded}
        aria-controls={`nav-section-${section.id}`}
      >
        {SectionIcon && <SectionIcon className="w-4 h-4 shrink-0" />}
        <span className="truncate flex-1 text-start">{t(section.titleKey)}</span>
        <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform duration-250 ease-out rtl:-scale-x-100 ${isExpanded ? 'rotate-90 rtl:rotate-90' : ''}`} />
      </button>

      {/* Accordion Content */}
      <div
        id={`nav-section-${section.id}`}
        role="region"
        className={`overflow-hidden transition-all duration-250 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        aria-hidden={!isExpanded}
      >
        <div className="ps-4 space-y-0.5 py-0.5">
          {visibleItems.map(item => {
            const ItemIcon = item.icon;
            const isActive = item.id === activeItemId;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] transition-all duration-200 cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {ItemIcon && <ItemIcon className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{t(item.titleKey)}</span>
                {item.badge && <Badge variant="secondary" className="ms-auto text-[10px] h-4 min-w-4 justify-center px-1">{item.badge}</Badge>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

// ============================================================
// Component: NavigationSidebar (Desktop)
// ============================================================

const NavigationSidebar = memo(function NavigationSidebar({
  config,
  context,
  activeItemId,
  onNavigate,
  onSignOut,
  expandedSections,
  toggleSection,
}: EnterpriseNavigationProps & {
  expandedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleDark = () => { document.documentElement.classList.toggle('dark'); setIsDark(!isDark); };

  const visibleSections = useMemo(() => config.sections.filter(s => isSectionVisible(s, context)), [config.sections, context]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 mb-2">
          {config.logo}
          <div className="min-w-0">
            <p className="text-sm font-bold font-[Poppins] truncate">{config.title}</p>
            {config.subtitle && <p className="text-[10px] text-muted-foreground truncate">{config.subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => changeLanguage(i18n.language === 'en' ? 'ar' : 'en')} className="cursor-pointer h-7 w-7" aria-label={t('language')}><Globe className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" onClick={toggleDark} className="cursor-pointer h-7 w-7" aria-label={isDark ? t('light_mode') : t('dark_mode')}>{isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</Button>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1" aria-label={t('main_navigation') || 'Main navigation'}>
          {visibleSections.map((section, idx) => (
            <div key={section.id}>
              {idx > 0 && <div className="border-t border-border/50 my-2 mx-2" />}
              <NavigationAccordion
                section={section}
                isExpanded={!!expandedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
                activeItemId={activeItemId}
                onNavigate={onNavigate}
                context={context}
              />
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-border p-3 shrink-0 space-y-1">
        {config.footerActions}
        {onSignOut && (
          <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-all duration-200 cursor-pointer">
            <LogOut className="w-4 h-4" /><span>{t('logout')}</span>
          </button>
        )}
      </div>
    </div>
  );
});

// ============================================================
// Component: NavigationDrawer (Mobile)
// ============================================================

function NavigationDrawer({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 start-0 w-72 bg-background border-e border-border z-50 transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className="absolute top-3 end-3 z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 cursor-pointer"><X className="w-4 h-4" /></Button>
        </div>
        {children}
      </aside>
    </>
  );
}

// ============================================================
// Main Component: EnterpriseNavigation
// ============================================================

export function EnterpriseNavigation(props: EnterpriseNavigationProps) {
  const { config, context, activeItemId, onNavigate, onSignOut } = props;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Expanded sections state with persistence
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const persisted = getPersistedState(config.portalId);
    // Auto-expand the section containing the active item
    const autoExpand: Record<string, boolean> = {};
    config.sections.forEach(section => {
      if (section.items.some(item => item.id === activeItemId)) {
        autoExpand[section.id] = true;
      }
    });
    return { ...autoExpand, ...persisted };
  });

  // Auto-expand active section when activeItemId changes
  useEffect(() => {
    config.sections.forEach(section => {
      if (section.items.some(item => item.id === activeItemId)) {
        setExpandedSections(prev => {
          if (prev[section.id]) return prev;
          const next = { ...prev, [section.id]: true };
          persistState(config.portalId, next);
          return next;
        });
      }
    });
  }, [activeItemId, config.sections, config.portalId]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = { ...prev, [sectionId]: !prev[sectionId] };
      persistState(config.portalId, next);
      return next;
    });
  }, [config.portalId]);

  const handleNavigate = useCallback((itemId: string) => {
    onNavigate(itemId);
    setMobileOpen(false); // Close drawer on mobile after navigation
  }, [onNavigate]);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-card shrink-0">
        <NavigationSidebar
          {...props}
          onNavigate={handleNavigate}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 start-3 z-30">
        <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)} className="h-9 w-9 cursor-pointer bg-background shadow-sm">
          <Menu className="w-4 h-4" />
        </Button>
      </div>

      {/* Mobile Drawer */}
      <NavigationDrawer isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
        <NavigationSidebar
          {...props}
          onNavigate={handleNavigate}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
        />
      </NavigationDrawer>
    </>
  );
}

// ============================================================
// Export helpers for portal configurations
// ============================================================

export { isItemVisible, isSectionVisible };
export type { EnterpriseNavigationProps };