/**
 * MatchMe Mobile App - Root Component
 * 
 * Production-ready React Native + Expo application
 * with Supabase backend, Zustand state management,
 * and feature-based architecture.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/stores';
import { useAppStore } from './src/stores';
import { authService } from './src/services';

function AuthInitializer({ children }: { children: React.ReactNode }) {
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
  }, []);

  return <>{children}</>;
}

export default function App() {
  const { theme } = useAppStore();

  return (
    <SafeAreaProvider>
      <AuthInitializer>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <AppNavigator />
      </AuthInitializer>
    </SafeAreaProvider>
  );
}