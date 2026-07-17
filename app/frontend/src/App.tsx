/**
 * Application root component.
 * Sets up providers, routing, and global state initialization.
 */

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/shared';
import { useAuthStore, useAppStore } from '@/stores';
import { authService } from '@/services';
import '@/lib/i18n';

// Page imports
import Index from './pages/Index';
import Auth from './pages/Auth';
import JobSeeker from './pages/JobSeeker';
import Company from './pages/Company';
import Messages from './pages/Messages';
import Subscription from './pages/Subscription';

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Auth initialization hook.
 * Listens to Supabase auth state changes and syncs with Zustand store.
 */
function useAuthInit() {
  const { setUser, setLoading, reset } = useAuthStore();

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data }) => {
      const session = (data as any)?.session;
      if (session?.user) {
        setUser(session.user.id, session.user.email || '');
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user.id, session.user.email || '');
      } else {
        reset();
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, reset]);
}

/**
 * Protected route wrapper.
 * Redirects unauthenticated users to login.
 */
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, userRole, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (requiredRole && userRole !== requiredRole) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

/**
 * Auth callback handler for email verification and password reset.
 */
function AuthCallbackHandler() {
  const { userRole } = useAuthStore();

  useEffect(() => {
    authService.getSession();
  }, []);

  if (userRole === 'company') return <Navigate to="/company" replace />;
  if (userRole === 'job_seeker') return <Navigate to="/seeker" replace />;
  return <Navigate to="/auth" replace />;
}

/**
 * Application routes configuration.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallbackHandler />} />
      <Route
        path="/seeker/*"
        element={
          <ProtectedRoute requiredRole="job_seeker">
            <JobSeeker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/*"
        element={
          <ProtectedRoute requiredRole="company">
            <Company />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/*"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * Root App component.
 */
const App = () => {
  const { i18n } = useTranslation();
  const { language } = useAppStore();

  // Initialize auth state
  useAuthInit();

  // Sync language direction
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, language]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

// Re-export for backward compatibility with existing pages
export const useAuth = () => {
  const store = useAuthStore();
  return {
    user: store.userId ? { id: store.userId, email: store.email } : null,
    session: null,
    userRole: store.userRole,
    setUserRole: store.setUserRole,
    loading: store.isLoading,
    signOut: store.signOut,
  };
};

// Legacy AuthContext export for gradual migration
export const AuthContext = {} as any;