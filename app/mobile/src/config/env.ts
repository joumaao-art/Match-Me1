/**
 * Environment configuration for the mobile app.
 */

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
  };
}

export const env: EnvConfig = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  app: {
    name: 'MatchMe',
    version: '1.0.0',
    environment: (process.env.EXPO_PUBLIC_APP_ENV as EnvConfig['app']['environment']) || 'development',
  },
};

export default env;