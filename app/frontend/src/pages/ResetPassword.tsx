/**
 * Reset Password page.
 * Handles the password update after clicking the reset link from email.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services';
import { ROUTES, VALIDATION } from '@/config/constants';
import { toast } from 'sonner';
import { Sparkles, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
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

    setLoading(true);
    try {
      const { error } = await authService.updatePassword(password);
      if (error) {
        toast.error(error.message || 'Failed to update password');
        return;
      }
      setSuccess(true);
      toast.success(t('password_updated'));
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength <= 2) return 'bg-orange-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-green-400';
    return 'bg-green-600';
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold font-[Poppins] mb-2">{t('password_updated')}</h2>
            <p className="text-muted-foreground mb-6">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Button onClick={() => navigate(ROUTES.AUTH)} className="w-full cursor-pointer">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-[Poppins]">{t('app_name')}</h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-[Poppins]">Set New Password</CardTitle>
            <CardDescription>
              Enter your new password below. Make sure it's strong and unique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
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
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
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
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}