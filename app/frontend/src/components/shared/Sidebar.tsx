/**
 * Reusable sidebar navigation component.
 * Supports dynamic nav items, theme/language toggles, and sign out.
 */

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore, useAppStore } from '@/stores';
import { Sparkles, Globe, Moon, Sun, CreditCard, LogOut } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ navItems, activeTab, onTabChange }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signOut } = useAuthStore();
  const { theme, toggleTheme, toggleLanguage } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold font-[Poppins]">{t('app_name')}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={toggleLanguage} className="cursor-pointer h-8 w-8">
            <Globe className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="cursor-pointer h-8 w-8">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-smooth cursor-pointer ${
              activeTab === item.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-1">
        <button
          onClick={() => navigate(ROUTES.SUBSCRIPTION)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-smooth cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          <span>{t('subscription')}</span>
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-smooth cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('logout')}</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;