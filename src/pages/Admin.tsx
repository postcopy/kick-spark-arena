import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Clock, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subscriber {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  trial_ends_at: string;
  subscription_status?: string;
}

export default function Admin() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    trialing: 0,
    active: 0,
    expired: 0,
  });

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const enrichedData = (data || []).map((profile) => {
        const trialEndsAt = new Date(profile.trial_ends_at);
        let status = 'expired';
        if (trialEndsAt > now) {
          status = 'trialing';
        }
        return { ...profile, subscription_status: status };
      });

      setSubscribers(enrichedData);

      const total = enrichedData.length;
      const trialing = enrichedData.filter((s) => s.subscription_status === 'trialing').length;
      const active = enrichedData.filter((s) => s.subscription_status === 'active').length;
      const expired = enrichedData.filter((s) => s.subscription_status === 'expired').length;

      setStats({ total, trialing, active, expired });
    } catch (err) {
      console.error('Error fetching subscribers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSubscribers();
    }
  }, [isAdmin]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[#E11D48]" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Painel Admin</h1>
            <p className="text-sm text-[#94A3B8]">Gerenciar usuarios</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/sounds">
              <Button variant="ghost" className="h-10 px-3 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]">
                <Volume2 className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              onClick={fetchSubscribers}
              variant="ghost"
              disabled={isLoading}
              className="h-10 px-3 rounded-xl text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E]"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-[#141420] rounded-xl border border-[#1E1E2E]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#1E1E2E] rounded-lg">
                <Users className="w-5 h-5 text-[#94A3B8]" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-[#64748B]">Total</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#141420] rounded-xl border border-[#F59E0B]/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#F59E0B]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{stats.trialing}</p>
                <p className="text-xs text-[#64748B]">Trial</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#141420] rounded-xl border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{stats.active}</p>
                <p className="text-xs text-[#64748B]">Ativos</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-[#141420] rounded-xl border border-[#E11D48]/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#E11D48]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#E11D48]" />
              </div>
              <div>
                <p className="font-mono text-2xl font-bold text-white">{stats.expired}</p>
                <p className="text-xs text-[#64748B]">Expirados</p>
              </div>
            </div>
          </div>
        </div>

        {/* User List */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-lg text-white">Usuarios recentes</h3>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#E11D48]" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8]">
              Nenhum usuario encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {subscribers.slice(0, 10).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-4 bg-[#141420] rounded-xl border border-[#1E1E2E]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {sub.full_name || sub.email}
                    </p>
                    <p className="text-sm text-[#64748B] truncate">
                      {sub.email}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                      sub.subscription_status === 'active'
                        ? 'bg-green-500/15 text-green-400'
                        : sub.subscription_status === 'trialing'
                        ? 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'bg-[#E11D48]/15 text-[#E11D48]'
                    }`}
                  >
                    {sub.subscription_status === 'active'
                      ? 'Ativo'
                      : sub.subscription_status === 'trialing'
                      ? 'Trial'
                      : 'Expirado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
