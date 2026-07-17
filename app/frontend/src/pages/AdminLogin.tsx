/**
 * Admin Login page.
 * Separate login flow for administrators.
 * Verifies admin status after authentication.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores';
import { authService } from '@/services';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';
import { ShieldCheck, ArrowLeft, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUserRole } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await authService.adminSignIn({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (data) {
        setUserRole('admin');
        toast.success('Welcome, Administrator');
        navigate(ROUTES.ADMIN_DASHBOARD, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.AUTH)} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          {/* Admin Logo */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-8 h-8 text-white dark:text-slate-900" />
            </div>
            <h1 className="text-2xl font-bold font-[Poppins]">Admin Portal</h1>
            <p className="text-sm text-muted-foreground mt-1">Restricted access - Administrators only</p>
          </div>

          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-[Poppins] text-lg">Administrator Login</CardTitle>
              <CardDescription>
                Enter your admin credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@matchme.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(null); }}
                      className="ps-10"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
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
                <Button
                  type="submit"
                  className="w-full cursor-pointer bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900"
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In as Admin'}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  This portal is for authorized administrators only.
                  <br />
                  Unauthorized access attempts are logged.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}