import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/types/forms';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, Key } from 'lucide-react';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, setDemoProfile, error, clearError } = useAuthStore();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    clearError();
    setSubmitting(true);
    const success = await signIn(data.email, data.password);
    setSubmitting(false);

    if (success) {
      toast.success('Successfully logged in');
      const currentRole = useAuthStore.getState().role;
      if (currentRole === 'OWNER') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } else {
      toast.error('Authentication failed. Check your email and password.');
    }
  };

  const handleDemoLogin = async (demoRole: 'OWNER' | 'EMPLOYEE') => {
    const demoEmail = demoRole === 'OWNER' ? 'owner@successtraders.com' : 'emp-101@successtraders.com';
    const demoPassword = 'Password123!';

    setValue('email', demoEmail);
    setValue('password', demoPassword);

    // If Supabase is configured, attempt real authentication first
    if (isSupabaseConfigured()) {
      clearError();
      setSubmitting(true);
      const success = await signIn(demoEmail, demoPassword);
      setSubmitting(false);

      if (success) {
        toast.success(`Signed in as ${demoRole} with active Supabase session!`);
        const currentRole = useAuthStore.getState().role;
        if (currentRole === 'OWNER') {
          navigate('/admin/dashboard');
        } else {
          navigate('/employee/dashboard');
        }
        return;
      }
    }

    // Fallback to client demo profile
    setDemoProfile(demoRole);
    toast.info(`Switched to ${demoRole} preview mode`);
    if (demoRole === 'OWNER') {
      navigate('/admin/dashboard');
    } else {
      navigate('/employee/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-950/50">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Success Trader
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Management & Trading Performance Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-100">Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access your portal
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="trader@successtraders.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={submitting}
            >
              Sign In to Panel
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Sign-in Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Sign In (Seed Accounts)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('OWNER')}
                className="text-xs border-emerald-500/30 hover:border-emerald-500/60"
                disabled={submitting}
              >
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Owner Account
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => handleDemoLogin('EMPLOYEE')}
                className="text-xs border-sky-500/30 hover:border-sky-500/60"
                disabled={submitting}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                Trader Account
              </Button>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Default: <code className="text-slate-400">owner@successtraders.com</code> • Password: <code className="text-slate-400">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
