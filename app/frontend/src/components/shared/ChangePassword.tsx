import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Eye, EyeOff, Lock, Check, X, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export function ChangePassword() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastSubmit, setLastSubmit] = useState(0);

  // Password strength calculation
  const getPasswordStrength = useCallback((password: string): number => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, []);

  const passwordStrength = getPasswordStrength(newPassword);

  const getStrengthLabel = (strength: number): string => {
    if (strength <= 1) return t('password_weak');
    if (strength <= 2) return t('password_medium');
    if (strength <= 3) return t('password_medium');
    if (strength <= 4) return t('password_strong');
    return t('password_very_strong');
  };

  const getStrengthColor = (strength: number): string => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-green-500';
    return 'bg-green-600';
  };

  const getStrengthPercent = (strength: number): number => {
    return (strength / 5) * 100;
  };

  // Password requirements
  const requirements: PasswordRequirement[] = [
    { label: t('req_min_8_chars'), met: newPassword.length >= 8 },
    { label: t('req_uppercase'), met: /[A-Z]/.test(newPassword) },
    { label: t('req_lowercase'), met: /[a-z]/.test(newPassword) },
    { label: t('req_number'), met: /[0-9]/.test(newPassword) },
    { label: t('req_special_char'), met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const allRequirementsMet = requirements.every(r => r.met);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const notSameAsCurrent = newPassword !== currentPassword || newPassword.length === 0;

  const canSubmit = currentPassword.length > 0 && allRequirementsMet && passwordsMatch && notSameAsCurrent && !loading;

  const handleSubmit = async () => {
    // Rate limiting - prevent rapid submissions (5 second cooldown)
    const now = Date.now();
    if (now - lastSubmit < 5000) {
      toast.error(t('error_rate_limit'));
      return;
    }
    setLastSubmit(now);

    if (!currentPassword) {
      toast.error(t('enter_current_password'));
      return;
    }

    if (!allRequirementsMet) {
      toast.error(t('password_requirements_not_met'));
      return;
    }

    if (!passwordsMatch) {
      toast.error(t('passwords_dont_match'));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t('new_password_same_as_current'));
      return;
    }

    setLoading(true);

    try {
      // First verify the current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error(t('error_session_expired'));
        setLoading(false);
        return;
      }

      // Verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        toast.error(t('incorrect_current_password'));
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        if (updateError.message.includes('weak') || updateError.message.includes('short')) {
          toast.error(t('password_too_weak'));
        } else if (updateError.message.includes('session') || updateError.message.includes('expired')) {
          toast.error(t('error_session_expired'));
        } else {
          toast.error(t('password_change_failed'));
        }
        setLoading(false);
        return;
      }

      // Success
      toast.success(t('password_changed_success'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        toast.error(t('error_network'));
      } else {
        toast.error(t('password_change_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t('change_password')}
        </CardTitle>
        <CardDescription>{t('change_password_desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Password */}
        <div>
          <Label htmlFor="current-password">{t('current_password')}</Label>
          <div className="relative mt-1">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="ps-9 pe-9"
              placeholder={t('enter_current_password')}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={showCurrent ? t('hide_password') : t('show_password')}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <Label htmlFor="new-password">{t('new_password')}</Label>
          <div className="relative mt-1">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="ps-9 pe-9"
              placeholder={t('enter_new_password')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={showNew ? t('hide_password') : t('show_password')}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('password_strength')}</span>
                <Badge variant="outline" className={`text-xs ${passwordStrength >= 4 ? 'text-green-600' : passwordStrength >= 3 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {getStrengthLabel(passwordStrength)}
                </Badge>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`} style={{ width: `${getStrengthPercent(passwordStrength)}%` }} />
              </div>

              {/* Requirements Checklist */}
              <div className="space-y-1 mt-2">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {req.met ? (
                      <Check className="w-3 h-3 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3 h-3 text-muted-foreground shrink-0" />
                    )}
                    <span className={req.met ? 'text-green-600' : 'text-muted-foreground'}>{req.label}</span>
                  </div>
                ))}
              </div>

              {/* Same as current warning */}
              {currentPassword && newPassword && currentPassword === newPassword && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <X className="w-3 h-3" />{t('new_password_same_as_current')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Confirm New Password */}
        <div>
          <Label htmlFor="confirm-new-password">{t('confirm_new_password')}</Label>
          <div className="relative mt-1">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirm-new-password"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="ps-9 pe-9"
              placeholder={t('confirm_new_password_placeholder')}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={showConfirm ? t('hide_password') : t('show_password')}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <X className="w-3 h-3" />{t('passwords_dont_match')}
            </p>
          )}
          {confirmPassword && passwordsMatch && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" />{t('passwords_match')}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('updating_password')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('change_password')}
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}