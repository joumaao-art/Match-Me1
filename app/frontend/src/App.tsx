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
import { ROUTES, STORAGE_KEYS } from '@/config/constants';
import { initializeSecurity, sessionManager, auditLogger } from '@/lib/security';
import { ensureIdentity, resolvePostAuthDestination } from '@/lib/signup-flow';
import { logger } from '@/lib/logger';
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

// Marketing pages
const LearnMore = lazy(() => import('./pages/LearnMore'));

// Feature pages - large, lazy loaded
const JobSeeker = lazy(() => import('./pages/JobSeeker'));
const JobSeekerOnboarding = lazy(() => import('./pages/JobSeekerOnboarding'));
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

/**
 * Hard ceiling for the initial session read (ms).
 * After this the application MUST boot: the loading gate is released and the
 * router renders the guest (or session) experience instead of spinning.
 */
const AUTH_BOOT_TIMEOUT_MS = 6000;

/**
 * Development-only execution trace for the boot sequence.
 * Diagnosing a non-settling loading gate requires a timestamped record of
 * which stage started, settled, failed, or was released by the watchdog.
 */
const trace = (stage: string, detail?: unknown) => {
  if (import.meta.env.DEV) logger.info(`[BootTrace] ${stage}`, detail ?? '');
};

function useAuthInit() {
  const { setUser, setLoading, setEmailVerified, fetchAndSetRole, reset } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    // GUARANTEED COMPLETION.
    // `isLoading` starts as `true` and is intentionally NOT persisted, so this
    // effect owns the only initial path that can release the loading gate.
    // It therefore has to settle in every possible outcome: resolve, reject,
    // or never settle at all.
    const releaseLoading = (stage: string) => {
      if (!mounted || settled) return;
      settled = true;
      setLoading(false);
      setInitialized(true);
      trace(`loading gate released (${stage})`);
    };

    trace('getSession started');
    const watchdog = setTimeout(() => {
      logger.warn(
        `[AuthInit] Session read exceeded ${AUTH_BOOT_TIMEOUT_MS}ms; booting as guest so the UI cannot hang.`
      );
      releaseLoading('timeout');
    }, AUTH_BOOT_TIMEOUT_MS);

    // Get initial session
    authService
      .getSession()
      .then(async ({ data, error }) => {
        trace('getSession resolved', {
          hasSession: !!(data as any)?.session,
          errorCode: error?.code ?? null,
        });
        if (!mounted) return;
        const session = (data as any)?.session;
        if (session?.user) {
          const user = session.user;
          setUser(user.id, user.email || '', !!user.email_confirmed_at);
          await fetchAndSetRole(user.id);
        }
        releaseLoading('session');
      })
      .catch((err) => {
        // A rejection here (malformed auth callback URL, storage access
        // failure, or a rejected supabase-js initialization) used to leave
        // `isLoading` at `true` forever because the old chain had no handler.
        logger.error('[AuthInit] Session read failed; booting as guest', err);
        if (mounted) reset();
        releaseLoading('error');
      })
      .finally(() => {
        clearTimeout(watchdog);
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
  const { isAuthenticated, userRole, userId, isLoading } = useAuthStore();
  const [destination, setDestination] = useState<string | null>(null);

  // Authenticated visitors are forwarded by role, and Job Seekers additionally
  // by onboarding state, so an unfinished seeker never bounces off a dashboard.
  useEffect(() => {
    if (!isAuthenticated || !userRole) { setDestination(null); return; }
    let alive = true;
    // Role-derived fallback so an unresolved lookup degrades to a usable
    // screen (the onboarding page self-redirects finished seekers onward)
    // instead of an indefinite loader.
    const roleFallback =
      userRole === 'admin'
        ? ROUTES.ADMIN_DASHBOARD
        : userRole === 'company'
          ? ROUTES.COMPANY
          : ROUTES.SEEKER_ONBOARDING;
    const fallbackTimer = setTimeout(() => {
      if (alive) setDestination(roleFallback);
    }, AUTH_BOOT_TIMEOUT_MS + 2000);
    resolvePostAuthDestination(userRole, userId)
      .then((dest) => {
        if (alive) setDestination(dest || roleFallback);
      })
      .catch(() => {
        if (alive) setDestination(roleFallback);
      })
      .finally(() => clearTimeout(fallbackTimer));
    return () => {
      alive = false;
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, userRole, userId]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated && userRole) {
    if (!destination) return <PageLoader />;
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}

function AuthCallbackHandler() {
  const { userRole, isAuthenticated, userId, email, setUserRole } = useAuthStore();
  const [bootstrapped, setBootstrapped] = useState(false);
  // Job Seeker landing is resolved from onboarding state, which needs a lookup.
  const [seekerDestination, setSeekerDestination] = useState<string | null>(null);

  useEffect(() => {
    authService.getSession();
  }, []);

  // First-time OAuth / phone return: bootstrap the profile from the pending role
  // captured before the provider redirect (Job Seeker signup path).
  useEffect(() => {
    if (!isAuthenticated || !userId || userRole || bootstrapped) return;
    let alive = true;
    (async () => {
      try {
        const dbRole = await authService.getUserRole(userId);
        if (!alive) return;
        if (dbRole) {
          setUserRole(dbRole);
        } else {
          const pending = localStorage.getItem(STORAGE_KEYS.PENDING_ROLE) as 'job_seeker' | 'company' | null;
          if (pending) {
            // Idempotent and time-boxed: a duplicated provider callback or a
            // retry can never fail on an existing profile, nor strand the user
            // on the loading screen.
            await ensureIdentity(userId, email || null, pending);
            localStorage.removeItem(STORAGE_KEYS.PENDING_ROLE);
            if (alive) setUserRole(pending);
          }
        }
      } finally {
        if (alive) setBootstrapped(true);
      }
    })();
    return () => { alive = false; };
  }, [isAuthenticated, userId, userRole, email, setUserRole, bootstrapped]);

  // Job Seeker: decide between the Welcome/onboarding screen and the dashboard.
  useEffect(() => {
    if (!isAuthenticated || userRole !== 'job_seeker' || !userId) return;
    let alive = true;
    // Same bounded contract as GuestRoute: the callback must always settle so a
    // returning OAuth/phone user can never be parked on the loader.
    const fallbackTimer = setTimeout(() => {
      if (alive) setSeekerDestination(ROUTES.SEEKER_ONBOARDING);
    }, AUTH_BOOT_TIMEOUT_MS + 2000);
    resolvePostAuthDestination('job_seeker', userId)
      .then((dest) => {
        if (alive) setSeekerDestination(dest || ROUTES.SEEKER_ONBOARDING);
      })
      .catch(() => {
        if (alive) setSeekerDestination(ROUTES.SEEKER_ONBOARDING);
      })
      .finally(() => clearTimeout(fallbackTimer));
    return () => {
      alive = false;
      clearTimeout(fallbackTimer);
    };
  }, [isAuthenticated, userRole, userId]);

  if (!isAuthenticated) return <Navigate to={ROUTES.AUTH} replace />;
  if (!userRole && !bootstrapped) return <PageLoader />;
  if (userRole === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  if (userRole === 'company') return <Navigate to={ROUTES.COMPANY} replace />;
  if (userRole === 'job_seeker') {
    if (!seekerDestination) return <PageLoader />;
    return <Navigate to={seekerDestination} replace />;
  }
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
      <Route
        path={ROUTES.LEARN_MORE}
        element={
          <Suspense fallback={<PageLoader />}>
            <LearnMore />
          </Suspense>
        }
      />

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

      {/* Role-specific subscription routes (must be before wildcards) */}
      <Route
        path="/seeker/subscription"
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Suspense fallback={<PageLoader />}>
              <Subscription />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/subscription"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <Suspense fallback={<PageLoader />}>
              <Subscription />
            </Suspense>
          </ProtectedRoute>
        }
      />
      {/* Legacy /subscription route - role-aware display */}
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

      {/* Protected routes - Job Seekers only */}
      <Route
        path={ROUTES.SEEKER_ONBOARDING}
        element={
          <ProtectedRoute allowedRoles={['job_seeker']}>
            <Suspense fallback={<PageLoader />}>
              <JobSeekerOnboarding />
            </Suspense>
          </ProtectedRoute>
        }
      />
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