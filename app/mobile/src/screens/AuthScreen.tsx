/**
 * Authentication screen - Login, Register, Role Selection.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../stores';
import { authService } from '../services';
import { spacing, borderRadius, fontSize } from '../theme';
import type { UserRole } from '../types';

type AuthView = 'role_select' | 'login' | 'register' | 'forgot_password';

export function AuthScreen() {
  const { colors, isDark } = useTheme();
  const { setUser, setUserRole } = useAuthStore();

  const [view, setView] = useState<AuthView>('role_select');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setView('login');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    const { data, error } = await authService.signIn({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
      return;
    }
    const session = (data as any)?.session;
    if (session?.user) {
      setUser(session.user.id, session.user.email || '');
      setUserRole(selectedRole);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await authService.signUp({ email, password, role: selectedRole! });
    setLoading(false);
    if (error) {
      Alert.alert('Registration Failed', error.message);
      return;
    }
    Alert.alert('Success', 'Please check your email to verify your account', [
      { text: 'OK', onPress: () => setView('login') },
    ]);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    setLoading(true);
    const { error } = await authService.resetPassword(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    Alert.alert('Success', 'Password reset email sent!', [
      { text: 'OK', onPress: () => setView('login') },
    ]);
  };

  const styles = createStyles(colors);

  if (view === 'role_select') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>✦</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>MatchMe</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>I am a...</Text>
        </View>

        <View style={styles.roleCards}>
          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleRoleSelect('job_seeker')}
            activeOpacity={0.7}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.primary + '15' }]}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </View>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Job Seeker</Text>
            <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
              Find your dream job with AI matching
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleRoleSelect('company')}
            activeOpacity={0.7}
          >
            <View style={[styles.roleIcon, { backgroundColor: colors.accent + '15' }]}>
              <Text style={{ fontSize: 24 }}>🏢</Text>
            </View>
            <Text style={[styles.roleTitle, { color: colors.text }]}>Company</Text>
            <Text style={[styles.roleDesc, { color: colors.textSecondary }]}>
              Find the perfect candidates for your team
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setView('role_select')} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>✦</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : 'Reset Password'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {selectedRole === 'job_seeker' ? 'Job Seeker' : 'Company'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
              placeholder="name@example.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {view !== 'forgot_password' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          )}

          {view === 'register' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}

          {view === 'login' && (
            <TouchableOpacity onPress={() => setView('forgot_password')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={view === 'login' ? handleLogin : view === 'register' ? handleRegister : handleForgotPassword}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
                {view === 'login' ? 'Sign In' : view === 'register' ? 'Create Account' : 'Send Reset Email'}
              </Text>
            )}
          </TouchableOpacity>

          {view === 'login' && (
            <TouchableOpacity onPress={() => setView('register')}>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                Don't have an account?{' '}
                <Text style={{ color: colors.primary }}>Register</Text>
              </Text>
            </TouchableOpacity>
          )}

          {view === 'register' && (
            <TouchableOpacity onPress={() => setView('login')}>
              <Text style={[styles.switchText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
                <Text style={{ color: colors.primary }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: spacing.lg },
    header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
    logo: { width: 48, height: 48, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
    logoText: { fontSize: 24, color: '#fff' },
    title: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.xs },
    subtitle: { fontSize: fontSize.md },
    roleCards: { gap: spacing.md, paddingHorizontal: spacing.md },
    roleCard: { padding: spacing.lg, borderRadius: borderRadius.xl, borderWidth: 2, alignItems: 'center' },
    roleIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
    roleTitle: { fontSize: fontSize.lg, fontWeight: '600', marginBottom: spacing.xs },
    roleDesc: { fontSize: fontSize.sm, textAlign: 'center' },
    backButton: { marginBottom: spacing.md },
    backText: { fontSize: fontSize.md, fontWeight: '500' },
    form: { gap: spacing.md },
    inputGroup: { gap: spacing.xs },
    label: { fontSize: fontSize.sm, fontWeight: '500' },
    input: { height: 48, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, fontSize: fontSize.md },
    button: { height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
    buttonText: { fontSize: fontSize.md, fontWeight: '600' },
    linkText: { fontSize: fontSize.sm, textAlign: 'right' },
    switchText: { fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.md },
  });
}

export default AuthScreen;