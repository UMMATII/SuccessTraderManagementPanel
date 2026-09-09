import { useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { AlertTriangle, Database, ShieldCheck, UserCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SupabaseBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { profile, setDemoProfile } = useAuthStore();
  const configured = isSupabaseConfigured();

  if (configured || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Supabase Setup Pending:</strong> Set <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_URL</code> and <code className="bg-amber-950/80 px-1 py-0.5 rounded text-amber-300">VITE_SUPABASE_ANON_KEY</code> in <code className="bg-amber-950/80 px-1 py-0.5 rounded">.env</code> to connect live PostgreSQL backend.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Quick Preview:</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/50"
            onClick={() => setDemoProfile('OWNER')}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            Owner Mode
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-sky-500/40 text-sky-400 hover:bg-sky-950/50"
            onClick={() => setDemoProfile('EMPLOYEE')}
          >
            <UserCheck className="w-3.5 h-3.5 mr-1" />
            Employee Mode
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-1 ml-1"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
