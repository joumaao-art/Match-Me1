import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import '@/lib/i18n';

import Index from './pages/Index';
import Auth from './pages/Auth';
import JobSeeker from './pages/JobSeeker';
import Company from './pages/Company';
import Messages from './pages/Messages';
import Subscription from './pages/Subscription';

// Auth Context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'job_seeker' | 'company' | null;
  setUserRole: (role: 'job_seeker' | 'company' | null) => void;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  setUserRole: () => {},
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient();

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'job_seeker' | 'company' | null>(
    (localStorage.getItem('matchme-role') as 'job_seeker' | 'company') || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetRole = (role: 'job_seeker' | 'company' | null) => {
    setUserRole(role);
    if (role) {
      localStorage.setItem('matchme-role', role);
    } else {
      localStorage.removeItem('matchme-role');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    handleSetRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, userRole, setUserRole: handleSetRole, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && userRole !== requiredRole) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}

const AppRoutes = () => (
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

function AuthCallbackHandler() {
  const { userRole } = useAuth();
  
  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        window.location.href = '/auth?error=callback_failed';
      }
    };
    handleCallback();
  }, []);

  if (userRole === 'company') return <Navigate to="/company" replace />;
  if (userRole === 'job_seeker') return <Navigate to="/seeker" replace />;
  return <Navigate to="/auth" replace />;
}

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;