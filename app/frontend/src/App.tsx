/**
 * Application root component.
 * Sets up providers, routing, and global state initialization.
 * Implements complete route protection with role-based access.
 * OPTIMIZED: Lazy loading, code splitting, performance monitoring.
 */

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBoundary } from '@/components/shared';
import { useAuthStore, useAppStore } from '@/stores';
import { authService } from '@/services';
import { ROUTES } from '@/config/constants';
import { initializeSecurity, sessionManager, auditLogger } from '@/lib/security';
import { optimizeStartup, trackPerformance, updateSEO } from '@/lib/performance';
import '@/lib/i18n';

// ============================================================
// LAZY LOADED PAGES - Code splitting for smaller initial bundle
// ============================================================

// Critical path - loaded eagerly (landing page)
import Index from './pages/Index';

// Auth pages - small, load on demand
const Auth = lazy(() => import('./pages/Auth'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Feature pages - large, lazy loaded
const JobSeeker = lazy(() => import('./pages/JobSeeker'));
const Company = lazy(() => import('./pages/Company'));
const Messages = lazy(() => import('./pages/Messages'));
const Subscription = lazy(() => import('./pages/Subscription'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const Analytics = lazy(() => import('./pages/Analytics'));

// ============================================================
// LOADING FALLBACK
// ============================================================

const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-muted border-t-primary" />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
    </div>
  </div>
));
PageLoader.displayName = 'PageLoader';

// ============================================================
// QUERY CLIENT - Optimized caching configuration
// ============================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min before refetch
      gcTime: 30 * 60 * 1000, // 30 min garbage collection (was cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      // Structural sharing reduces re-renders for unchanged data
      structuralSharing: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================================
// AUTH INITIALIZATION
// ============================================================

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
        // Handled by ResetPassword page
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

// ============================================================
// ROUTE GUARDS
// ============================================================

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
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
    if (userRole === 'job_seeker') return <Navigate to={ROUTES.SEEKER} replace />;
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, userRole, isLoading } = useAuthStore();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && userRole) {
    if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
    if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
    if (userRole === 'job_seeker') return <Navigate to={ROUTES.SEEKER} replace />;
  }

  return <>{children}</>;
}

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

// ============================================================
// ROUTES - With Suspense boundaries for lazy components
// ============================================================

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - Index loaded eagerly for fast LCP */}
      <Route path={ROUTES.HOME} element={<Index />} />

      {/* Guest-only routes */}
      <Route
        path={ROUTES.AUTH}
        element={
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <Auth />
            </Suspense>
          </GuestRoute>
        }
      />
      <Route
        path={ROUTES.ADMIN_LOGIN}
        element={
          <GuestRoute>
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          </GuestRoute>
        }
      />

      {/* Auth utility routes */}
      <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallbackHandler />} />
      <Route
        path={ROUTES.AUTH_RESET_PASSWORD}
        element={
          <Suspense fallback={<PageLoader />}>
            <ResetPassword />
          </Suspense>
        }
      />

      {/* Protected routes - Job Seekers only */}
      <Route
        path="/seeker/*"
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Suspense fallback={<PageLoader />}>
              <JobSeeker />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Companies only */}
      <Route
        path="/company/*"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <Suspense fallback={<PageLoader />}>
              <Company />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Any authenticated user */}
      <Route
        path="/messages/*"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company']}>
            <Suspense fallback={<PageLoader />}>
              <Messages />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company']}>
            <Suspense fallback={<PageLoader />}>
              <Subscription />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['job_seeker', 'company', 'admin']}>
            <Suspense fallback={<PageLoader />}>
              <Notifications />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected routes - Admin only */}
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Suspense fallback={<PageLoader />}>
              <Admin />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
  );
}

// ============================================================
// ROOT APP COMPONENT
// ============================================================

const App = () => {
  const { i18n } = useTranslation();
  const { language } = useAppStore();
  const { signOut, isAuthenticated } = useAuthStore();

  // Initialize auth state
  useAuthInit();

  // Initialize security + performance on mount
  useEffect(() => {
    initializeSecurity();
    optimizeStartup();

    // Track Core Web Vitals in development
    if (import.meta.env.DEV) {
      trackPerformance();
    }

    // Set default SEO
    updateSEO({
      title: 'MatchMe - AI-Powered Recruitment Platform',
      description: 'Find your perfect job match with AI-powered recruitment. Swipe-based matching for job seekers and companies.',
      keywords: ['recruitment', 'jobs', 'AI matching', 'career', 'hiring', 'job search'],
      ogType: 'website',
    });
  }, []);

  // Session management
  useEffect(() => {
    if (isAuthenticated) {
      sessionManager.start({
        onExpire: () => {
          auditLogger.log({
            action: 'session_auto_expired',
            category: 'auth',
            severity: 'info',
          });
          signOut();
        },
        onWarning: (remainingMs) => {
          const mins = Math.ceil(remainingMs / 60000);
          console.warn(`[Session] Expiring in ${mins} minute(s)`);
        },
      });
    } else {
      sessionManager.stop();
    }
    return () => sessionManager.stop();
  }, [isAuthenticated, signOut]);

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