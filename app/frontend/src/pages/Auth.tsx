import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/App';
import { supabase } from '@/lib/supabase';
import { changeLanguage } from '@/lib/i18n';
import { toast } from 'sonner';
import { Sparkles, UserCircle, Building2, ArrowLeft, Globe, Mail, Lock, Eye, EyeOff } from 'lucide-react';

type AuthView = 'role_select' | 'login' | 'register' | 'forgot_password' | 'verify_email';

export default function Auth() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userRole, setUserRole } = useAuth();
  
  const [view, setView] = useState<AuthView>('role_select');
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'company' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get('role') as 'job_seeker' | 'company' | null;
    if (roleParam) {
      setSelectedRole(roleParam);
      setView('login');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === 'company' ? '/company' : '/seeker');
    }
  }, [user, userRole, navigate]);

  const handleRoleSelect = (role: 'job_seeker' | 'company') => {
    setSelectedRole(role);
    setView('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setUserRole(selectedRole);
      navigate(selectedRole === 'company' ? '/company' : '/seeker');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      setView('verify_email');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (error) throw error;
      toast.success('Password reset email sent!');
      setView('login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex justify-between items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleLang} className="cursor-pointer">
          <Globe className="w-4 h-4" />
        </Button>
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
                className="cursor-pointer border-2 hover:border-primary/50 transition-smooth"
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
                className="cursor-pointer border-2 hover:border-accent/50 transition-smooth"
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
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
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
                  <Button variant="link" className="p-0 h-auto cursor-pointer" onClick={() => setView('register')}>
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
                  <div className="space-y-2">
                    <Label htmlFor="reg-confirm">{t('confirm_password')}</Label>
                    <Input
                      id="reg-confirm"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
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
              </CardHeader>
              <CardContent>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('email')}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
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
                <Button onClick={() => setView('login')} className="cursor-pointer">
                  {t('back')} {t('login')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}