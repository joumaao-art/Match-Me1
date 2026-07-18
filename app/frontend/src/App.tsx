/**
 * Application root component.
 * Sets up providers, routing, and global state initialization.
 * Implements complete route protection with role-based access.
 */

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/shared';
import { useAuthStore, useAppStore } from '@/stores';
import { authService } from '@/services';
import { ROUTES } from '@/config/constants';
import '@/lib/i18n';

// Page imports
import Index from './pages/Index';
import Auth from './pages/Auth';
import AdminLogin from './pages/AdminLogin';
import ResetPassword from './pages/ResetPassword';
import JobSeeker from './pages/JobSeeker';
import Company from './pages/Company';
import Messages from './pages/Messages';
import Subscription from './pages/Subscription';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';

// Query client configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Auth initialization hook.
 * Listens to Supabase auth state changes, fetches role from DB,
 * and syncs with Zustand store.
 */
function useAuthInit() {
  const { setUser, setLoading, setEmailVerified, fetchAndSetRole, reset } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    authService.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = (data as any)?.session;
      if (session?.user) {
        const user = session.user;
        setUser(user.id, user.email || '', !!user.email_confirmed_at);
        // Fetch role from database
        await fetchAndSetRole(user.id);
      } else {
        setLoading(false);
      }
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (_event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        setUser(user.id, user.email || '', !!user.email_confirmed_at);
        await fetchAndSetRole(user.id);
      } else if (_event === 'SIGNED_OUT') {
        reset();
      } else if (_event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user.id, session.user.email || '', !!session.user.email_confirmed_at);
      } else if (_event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link - handled by ResetPassword page
      } else if (_event === 'USER_UPDATED' && session?.user) {
        setEmailVerified(!!session.user.email_confirmed_at);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, setEmailVerified, fetchAndSetRole, reset]);

  return initialized;
}

/**
 * Protected route wrapper.
 * Redirects unauthenticated users to login.
 * Enforces role-based access control.
 */
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, userRole, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  // Role-based access check
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
    if (userRole === 'job_seeker') return <Navigate to={ROUTES.SEEKER} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

/**
 * Guest-only route wrapper.
 * Redirects authenticated users to their dashboard.
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userRole, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated && userRole) {
    if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
    if (userRole === 'job_seeker') return <Navigate to={ROUTES.SEEKER} replace />;
  }

  return <>{children}</>;
}

/**
 * Auth callback handler for email verification and password reset.
 */
function AuthCallbackHandler() {
  const { userRole, isAuthenticated } = useAuthStore();

  useEffect(() => {
    authService.getSession();
  }, []);

  if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />;
  if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
  if (userRole === 'job_seeker') return <Navigate to={ROUTES.SEEKER} replace />;
  return <Navigate to={ROUTES.AUTH} replace />;
}

/**
 * Application routes configuration with full protection.
 */
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path={ROUTES.HOME} element={<Index />} />

      {/* Guest-only routes (redirect if already logged in) */}
      <Route
        path={ROUTES.AUTH}
        element={
          <GuestRoute>
            <Auth />
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_LOGIN}
        element={
          <GuestRoute>
            <AdminLogin />
          </GuestRoute>
        }
      />

      {/* Auth utility routes */}
      <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackHandler />} />
      <Route path={ROUTES.AUTH_RESET_PASSWORD} element={<ResetPassword />} />

      {/* Protected routes - Job Seekers only */}
      <Route
        path="/seeker/*"
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <JobSeeker />
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Companies only */}
      <Route
        path="/company/*"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <Company />
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Any authenticated user */}
      <Route
        path="/messages/*"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company']}>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company']}>
            <Subscription />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company', 'admin']}>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Admin only */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Admin />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
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