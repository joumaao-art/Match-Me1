/**
 * Environment configuration with runtime validation.
 * All environment variables are accessed through this module.
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
  stripe: {
    publishableKey: string;
  };
}

function getEnvVar(key: string, fallback?: string): string {
  const value = import.meta.env[key] || fallback || '';
  return value;
}

function getRequiredEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value && import.meta.env.PROD) {
    console.warn(`[ENV] Missing required environment variable: ${key}`);
  }
  return value || '';
}

export const env: EnvConfig = {
  supabase: {
    url: getRequiredEnvVar('VITE_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  app: {
    name: getEnvVar('VITE_APP_NAME', 'MatchMe'),
    version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
    environment: (getEnvVar('VITE_APP_ENV', 'development') as EnvConfig['app']['environment']),
  },
  stripe: {
    publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY', ''),
  },
};

export default env;