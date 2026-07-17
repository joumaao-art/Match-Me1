/**
 * Shared page layout with sidebar navigation.
 * Used by both JobSeeker and Company dashboards.
 */

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores';

interface PageLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  title?: string;
}

export function PageLayout({ sidebar, children, title }: PageLayoutProps) {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-e border-border flex-col bg-sidebar-background">
        {sidebar}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute start-0 top-0 bottom-0 w-64 bg-sidebar-background border-e border-border">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <span className="font-bold font-[Poppins] capitalize">{title}</span>
          <div className="w-9" />
        </header>

        {/* Content */}
        {children}
      </main>
    </div>
  );
}

export default PageLayout;