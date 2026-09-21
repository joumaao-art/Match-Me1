/**
 * Authentication page.
 * Handles role selection, login, registration, email verification,
 * and password recovery for Job Seekers and Companies.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { changeLanguage } from '@/lib/i18n';
import { VALIDATION, ROUTES, STORAGE_KEYS } from '@/config/constants';
import { toast } from 'sonner';
import { Sparkles, UserCircle, Building2, ArrowLeft, Globe, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { SignupMethodButton, OtpInput } from '@/components/onboarding/OnboardingKit';
import {
  completeSeekerSignup,
  ensureIdentity,
  resolvePostAuthDestination,
} from '@/lib/signup-flow';

type AuthView =
  | 'role_select' | 'login' | 'register' | 'forgot_password' | 'verify_email'
  | 'seeker_signup' | 'seeker_phone' | 'seeker_otp';

// Dial codes offered for Job Seeker phone/OTP signup (GCC-first).
const DIAL_CODES = ['+966', '+971', '+20', '+962', '+965', '+974', '+973', '+968', '+1', '+44'];

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, userRole, userId, setUserRole, setRememberMe } = useAuthStore();

  const [view, setView] = useState<AuthView>('role_select');
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'company' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMeLocal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  // Job Seeker phone/OTP signup state
  const [phone, setPhone] = useState('');
  const [dialCode, setDialCode] = useState('+966');
  const [phoneE164, setPhoneE164] = useState('');
  const [otp, setOtp] = useState('');

  // Get intended destination from navigation state
  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    const roleParam = searchParams.get('role') as 'job_seeker' | 'company' | null;
    if (roleParam) {
      setSelectedRole(roleParam);
      setView('login');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isAuthenticated || !userRole) return;
    let alive = true;
    // Resolve through the shared
    // router so a Job Seeker who has not finished onboarding is sent to the
    // Welcome screen instead of a dashboard they cannot use.
    resolvePostAuthDestination(userRole, userId).then((destination) => {
      if (alive) navigate(from || destination, { replace: true });
    });
    return () => { alive = false; };
  }, [isAuthenticated, userRole, userId, navigate, from]);

  // Password strength calculator
  useEffect(() => {
    if (!password) { setPasswordStrength(0); return; }
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  const handleRoleSelect = (role: 'job_seeker' | 'company') => {
    setSelectedRole(role);
    // Job Seekers get the modern signup journey; Companies keep the classic login.
    setView(role === 'job_seeker' ? 'seeker_signup' : 'login');
  };

  // ---- Job Seeker signup: Apple / Google OAuth + phone OTP (Company auth untouched) ----

  const startOAuth = async (provider: 'apple' | 'google') => {
    setLoading(true);
    try {
      // Remember the intended role so /auth/callback can bootstrap the profile.
      localStorage.setItem(STORAGE_KEYS.PENDING_ROLE, 'job_seeker');
      const { error } = await authService.signInWithOAuth(provider);
      if (error) {
        localStorage.removeItem(STORAGE_KEYS.PENDING_ROLE);
        toast.error(error.message || t('ob_oauth_unavailable'));
      }
      // On success the browser is redirected to the provider.
    } catch {
      localStorage.removeItem(STORAGE_KEYS.PENDING_ROLE);
      toast.error(t('ob_oauth_unavailable'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = authService.normalizePhone(phone, dialCode);
    if (!normalized) { toast.error(t('ob_err_phone')); return; }
    setLoading(true);
    try {
      const { error } = await authService.sendPhoneOtp(normalized);
      if (error) { toast.error(error.message || t('ob_otp_unavailable')); return; }
      setPhoneE164(normalized);
      setOtp('');
      setView('seeker_otp');
      toast.success(t('ob_otp_sent'));
    } catch {
      toast.error(t('ob_otp_unavailable'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phoneE164) return;
    const { error } = await authService.sendPhoneOtp(phoneE164);
    if (!error) toast.success(t('ob_otp_sent'));
  };

  const handleVerifyOtp = async (code?: string) => {
    const token = (code ?? otp).trim();
    if (token.length !== 6) { toast.error(t('ob_err_otp')); return; }
    setLoading(true);
    try {
      const { data, error } = await authService.verifyPhoneOtp(phoneE164, token);
      if (error || !data) { toast.error(error?.message || t('ob_err_otp')); return; }
      const user = (data as any)?.user;
      if (!user?.id) { toast.error(t('ob_err_otp')); return; }
      // Duplicate-account handling: existing users just sign in with their role.
      const dbRole = await authService.getUserRole(user.id);
      setRememberMe(true);
      if (dbRole) {
        setUserRole(dbRole);
        navigate(
          dbRole === 'company'
            ? ROUTES.COMPANY
            : await resolvePostAuthDestination(dbRole, user.id),
          { replace: true }
        );
      } else {
        // Brand-new phone signup -> idempotent identity bootstrap, then resolve
        // the destination. Unfinished seekers always land on the Welcome screen.
        setUserRole('job_seeker');
        const { destination } = await completeSeekerSignup(
          user.id,
          user.email || user.phone || ''
        );
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message || t('ob_err_otp'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('fill_all_fields'));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await authService.signIn({ email, password });
      if (error) {
        toast.error(error.message || t('login_failed'));
        return;
      }

      // Set remember me preference
      setRememberMe(rememberMe);

      const session = (data as any)?.session;
      const user = session?.user;

      if (user) {
        // Fetch role from database
        const dbRole = await authService.getUserRole(user.id);

        if (dbRole) {
          setUserRole(dbRole);
          // Role-aware destination: Job Seekers are resolved by onboarding state.
          const destination = await resolvePostAuthDestination(dbRole, user.id);
          navigate(from || destination, { replace: true });
        } else if (selectedRole) {
          // First login after registration - ensure the profile exists idempotently.
          setUserRole(selectedRole);
          if (selectedRole === 'job_seeker') {
            await ensureIdentity(user.id, user.email || null, 'job_seeker');
            const destination = await resolvePostAuthDestination('job_seeker', user.id);
            navigate(from || destination, { replace: true });
          } else {
            await authService.createUserProfile(user.id, selectedRole);
            await authService.createRoleProfile(user.id, selectedRole, user.email || '');
            navigate(from || ROUTES.COMPANY, { replace: true });
          }
        } else {
          // No role found and none selected - go to role selection
          setView('role_select');
          toast.info(t('select_role'));
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error(t('fill_all_fields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('passwords_dont_match'));
      return;
    }
    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      toast.error(t('password_too_short'));
      return;
    }
    if (!selectedRole) {
      toast.error(t('select_role'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await authService.signUp({ email, password, role: selectedRole });
      if (error) {
        toast.error(error.message || t('registration_failed'));
        return;
      }

      const user = (data as any)?.user;

      // If email confirmation is required, show verification screen
      if (user && !user.email_confirmed_at) {
        setView('verify_email');
        toast.success(t('verification_email_sent'));
      } else if (user) {
        // Email confirmation disabled in Supabase settings - auto-login.
        // Job Seekers always start at the Welcome/onboarding screen; Company
        // authentication and its destination are preserved unchanged.
        setUserRole(selectedRole);
        if (selectedRole === 'job_seeker') {
          const { destination } = await completeSeekerSignup(user.id, email);
          navigate(destination, { replace: true });
        } else {
          await authService.createUserProfile(user.id, selectedRole);
          await authService.createRoleProfile(user.id, selectedRole, email);
          navigate(ROUTES.COMPANY, { replace: true });
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('registration_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('enter_email'));
      return;
    }
    setLoading(true);
    try {
      const { error } = await authService.resetPassword(email);
      if (error) {
        toast.error(error.message || t('reset_failed'));
        return;
      }
      toast.success(t('reset_email_sent'));
      setView('login');
    } catch (error: any) {
      toast.error(error.message || t('reset_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await authService.resendVerification(email);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t('verification_resent'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return t('weak');
    if (passwordStrength <= 2) return t('fair');
    if (passwordStrength <= 3) return t('good');
    if (passwordStrength <= 4) return t('strong');
    return t('very_strong');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(ROUTES.ADMIN_LOGIN)}
            className="cursor-pointer text-xs text-muted-foreground"
          >
            <ShieldCheck className="w-3 h-3 me-1" />
            Admin
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleLang} className="cursor-pointer">
            <Globe className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold font-[Poppins]">{t('app_name')}</h1>
          </div>

          {/* Role Selection */}
          {view === 'role_select' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold font-[Poppins] text-center mb-6">{t('i_am')}</h2>
              <Card
                className="cursor-pointer border-2 hover:border-primary/50 transition-all duration-200"
                onClick={() => handleRoleSelect('job_seeker')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-[Poppins]">{t('job_seeker')}</h3>
                    <p className="text-sm text-muted-foreground">{t('job_seeker_desc')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer border-2 hover:border-accent/50 transition-all duration-200"
                onClick={() => handleRoleSelect('company')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-[Poppins]">{t('company')}</h3>
                    <p className="text-sm text-muted-foreground">{t('company_desc')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Job Seeker Signup Methods (Apple / Google / Phone / Email) */}
          {view === 'seeker_signup' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('ob_signup_title')}</CardTitle>
                <CardDescription>{t('ob_signup_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SignupMethodButton kind="apple" onClick={() => startOAuth('apple')} disabled={loading} />
                <SignupMethodButton kind="google" onClick={() => startOAuth('google')} disabled={loading} />
                <SignupMethodButton kind="phone" onClick={() => setView('seeker_phone')} disabled={loading} />
                <SignupMethodButton kind="email" onClick={() => setView('register')} disabled={loading} />
                <div className="pt-1 text-center text-sm">
                  <span className="text-muted-foreground">{t('ob_signup_already')} </span>
                  <Button variant="link" className="p-0 h-auto cursor-pointer" onClick={() => setView('login')}>
                    {t('ob_signup_welcome_back')}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer"
                  onClick={() => { setView('role_select'); setSelectedRole(null); }}
                >
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('back')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job Seeker Phone Entry */}
          {view === 'seeker_phone' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('ob_phone_title')}</CardTitle>
                <CardDescription>{t('ob_phone_subtitle')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="flex gap-2">
                    <Label htmlFor="dial" className="sr-only">{t('ob_country_code')}</Label>
                    <select
                      id="dial"
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {DIAL_CODES.map((code) => <option key={code} value={code}>{code}</option>)}
                    </select>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder={t('phone_placeholder')}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                    {loading ? t('loading') : t('ob_send_code')}
                  </Button>
                </form>
                <Button variant="ghost" className="w-full mt-2 cursor-pointer" onClick={() => setView('seeker_signup')}>
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('back')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Job Seeker OTP Verification */}
          {view === 'seeker_otp' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('ob_otp_title')}</CardTitle>
                <CardDescription>{t('ob_otp_subtitle')} {phoneE164}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <OtpInput value={otp} onChange={setOtp} onComplete={(v) => handleVerifyOtp(v)} />
                <Button className="w-full cursor-pointer" disabled={loading || otp.length !== 6} onClick={() => handleVerifyOtp()}>
                  {loading ? t('loading') : t('ob_otp_verify')}
                </Button>
                <div className="flex items-center justify-between">
                  <Button variant="link" className="p-0 h-auto text-sm cursor-pointer" onClick={handleResendOtp}>
                    {t('ob_otp_resend')}
                  </Button>
                  <Button variant="ghost" className="p-0 h-auto text-sm cursor-pointer" onClick={() => setView('seeker_phone')}>
                    {t('back')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login Form */}
          {view === 'login' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('login')}</CardTitle>
                <CardDescription>
                  {selectedRole === 'job_seeker' ? t('job_seeker') : t('company')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-10 pe-10"
                        autoComplete="current-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMeLocal(checked as boolean)}
                      />
                      <Label htmlFor="remember" className="text-sm cursor-pointer">{t('remember_me')}</Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm p-0 h-auto cursor-pointer"
                      onClick={() => setView('forgot_password')}
                    >
                      {t('forgot_password')}
                    </Button>
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                    {loading ? t('loading') : t('login')}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">{t('dont_have_account')} </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto cursor-pointer"
                    onClick={() => setView(selectedRole === 'job_seeker' ? 'seeker_signup' : 'register')}
                  >
                    {t('register')}
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full mt-2 cursor-pointer"
                  onClick={() => { setView('role_select'); setSelectedRole(null); }}
                >
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('back')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Register Form */}
          {view === 'register' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('register')}</CardTitle>
                <CardDescription>
                  {selectedRole === 'job_seeker' ? t('job_seeker') : t('company')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">{t('password')}</Label>
                    <div className="relative">
                      <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-10 pe-10"
                        autoComplete="new-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute end-1 top-1/2 -translate-y-1/2 h-8 w-8 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    {/* Password strength indicator */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength ? getPasswordStrengthColor() : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{getPasswordStrengthText()}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">{t('confirm_password')}</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">{t('passwords_dont_match')}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full cursor-pointer"
                    disabled={loading || (!!confirmPassword && password !== confirmPassword)}
                  >
                    {loading ? t('loading') : t('register')}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  <span className="text-muted-foreground">{t('already_have_account')} </span>
                  <Button variant="link" className="p-0 h-auto cursor-pointer" onClick={() => setView('login')}>
                    {t('login')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Forgot Password */}
          {view === 'forgot_password' && (
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-[Poppins]">{t('reset_password')}</CardTitle>
                <CardDescription>{t('reset_password_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('email')}</Label>
                    <div className="relative">
                      <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                    {loading ? t('loading') : t('send_reset_email')}
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  className="w-full mt-4 cursor-pointer"
                  onClick={() => setView('login')}
                >
                  <ArrowLeft className="w-4 h-4 me-2" />
                  {t('back')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Verify Email */}
          {view === 'verify_email' && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-semibold font-[Poppins] mb-2">{t('verify_email')}</h2>
                <p className="text-muted-foreground mb-6">{t('verify_email_msg')}</p>
                <div className="space-y-3">
                  <Button onClick={() => setView('login')} className="w-full cursor-pointer">
                    {t('back_to_login')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="w-full cursor-pointer"
                  >
                    {loading ? t('loading') : t('resend_verification')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}