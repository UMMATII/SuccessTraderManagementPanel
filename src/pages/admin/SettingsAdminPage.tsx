import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { Settings, ShieldCheck, Database, CheckCircle, AlertTriangle, Key, User } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsAdminPage() {
  const { profile, refreshProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const configured = isSupabaseConfigured();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setIsSaving(true);
      const res = await profileService.updateProfile(profile.id, {
        name,
        avatar_url: avatarUrl || null,
      });
      if (!res.error) {
        toast.success('Owner profile updated');
        await refreshProfile();
      } else {
        toast.error(res.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-300" />
          System & Organization Settings
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Owner preferences, trading firm parameters, and Supabase integration status
        </p>
      </div>

      {/* Backend & Security Diagnostics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Supabase Backend Connectivity
              </CardTitle>
              <CardDescription>
                Live PostgreSQL database & Supabase Auth synchronization state
              </CardDescription>
            </div>
            {configured ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Live PostgreSQL Connected
              </Badge>
            ) : (
              <Badge variant="warning" className="gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Configuration Pending
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span>Supabase Project URL:</span>
              <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono">
                {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
              </code>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Row Level Security (RLS):</span>
              <span className="text-emerald-400 font-semibold">Enabled across all 5 tables</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Auth Method:</span>
              <span className="text-slate-300">Supabase Auth (Email / Password)</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Database Migrations:</span>
              <span className="font-mono text-slate-400">supabase/migrations/001_initial_schema.sql</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            Owner Profile Details
          </CardTitle>
          <CardDescription>Update your displayed name and avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Employee / Admin Code"
                value={profile?.employee_id || 'OWNER-001'}
                disabled
                helperText="Fixed system authorization code"
              />
            </div>

            <AvatarUpload
              label="Owner Profile Photo"
              name={profile?.name || 'Owner'}
              userId={profile?.id}
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
              size="lg"
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
