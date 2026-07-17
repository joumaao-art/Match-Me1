/**
 * Theme hook - provides current theme colors based on app store.
 */

import { useAppStore } from '../stores';
import { colors, type ThemeColors } from '../theme';
import { useColorScheme } from 'react-native';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const { theme } = useAppStore();
  const systemScheme = useColorScheme();

  const isDark = theme === 'system' ? systemScheme === 'dark' : theme === 'dark';

  return {
    colors: isDark ? colors.dark : colors.light,
    isDark,
  };
}