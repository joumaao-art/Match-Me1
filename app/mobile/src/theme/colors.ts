/**
 * Color palette for the mobile app.
 * Matches the web app's design system.
 */

export interface ThemeColors {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  destructive: string;
  success: string;
  muted: string;
}

export const colors: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    secondary: '#3B82F6',
    accent: '#F97316',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    destructive: '#EF4444',
    success: '#22C55E',
    muted: '#F1F5F9',
  },
  dark: {
    primary: '#3B82F6',
    primaryForeground: '#FFFFFF',
    secondary: '#60A5FA',
    accent: '#FB923C',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    destructive: '#F87171',
    success: '#4ADE80',
    muted: '#1E293B',
  },
};