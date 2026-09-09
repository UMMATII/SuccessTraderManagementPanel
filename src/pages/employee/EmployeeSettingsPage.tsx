import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/types/forms';
import { Settings, Lock, Shield, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function EmployeeSettingsPage() {
  const { profile, signOut } = useAuthStore();
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onPasswordSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsUpdatingPassword(true);
      await authService.updateUserPassword(data.password);
      toast.success('Password updated successfully');
      reset();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-300" />
          Account & Security Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your credentials, trading panel security, and authentication sessions
        </p>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your login password to maintain high security standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingPassword}
              >
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Session Card */}
      <Card className="border-slate-800 bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            Session Security
          </CardTitle>
          <CardDescription>
            You are logged in as {profile?.name} ({profile?.employee_id})
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            End your current session across devices
          </span>
          <Button
            variant="danger"
            size="sm"
            onClick={() => signOut()}
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
