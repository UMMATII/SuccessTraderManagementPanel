import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profileService } from '@/services/profileService';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StatusBadge } from '@/components/ui/Badge';
import { AvatarUpload } from '@/components/ui/AvatarUpload';
import { formatDate } from '@/lib/date-utils';
import { User, Shield, Lock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function MyProfilePage() {
  const { profile, refreshProfile } = useAuthStore();
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setIsSaving(true);
      const res = await profileService.updateProfile(profile.id, {
        name,
        avatar_url: avatarUrl || null,
      });

      if (!res.error) {
        toast.success('Profile updated successfully');
        await refreshProfile();
      } else {
        toast.error(res.error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-emerald-400" />
          Trader Profile
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Your personal account identification and display preferences
        </p>
      </div>

      {/* Main Profile Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-emerald-500/40 overflow-hidden flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-emerald-950/40">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile.name.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">{profile.name}</h2>
              <StatusBadge status={profile.status} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Employee ID: <span className="font-mono text-emerald-400">{profile.employee_id}</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Member since {formatDate(profile.joining_date)}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-6">
          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <AvatarUpload
            label="Profile Photo"
            name={profile.name}
            userId={profile.id}
            value={avatarUrl}
            onChange={(url) => setAvatarUrl(url)}
            size="lg"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Trader ID (Read-only)"
                value={profile.employee_id}
                disabled
                helperText="Enforced by database RLS"
              />
            </div>
            <div>
              <Input
                label="Role Permission (Read-only)"
                value={profile.role}
                disabled
                helperText="Enforced by database RLS"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
