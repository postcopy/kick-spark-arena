import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Users, Crown, Clock, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SiteLayout } from '@/components/layout/SiteLayout';

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
      <div className="flex items-center justify-center h-[100dvh] bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-game-yellow" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <SiteLayout 
      title="Painel Admin" 
      subtitle="Gerenciar usuários"
      backTo="/"
    >
      <div className="space-y-6">
        {/* Ações rápidas */}
        <div className="flex gap-2">
          <Link to="/admin/sounds" className="flex-1">
            <Button variant="outline" className="w-full h-12 md:h-14 text-base font-semibold rounded-xl gap-2">
              <Volume2 className="w-5 h-5" />
              Sons
            </Button>
          </Link>
          <Button 
            onClick={fetchSubscribers} 
            variant="outline" 
            disabled={isLoading}
            className="h-12 md:h-14 px-4 rounded-xl"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Stats Cards - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="p-4 md:p-5 bg-game-surface rounded-2xl border-2 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary rounded-xl">
                <Users className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 bg-game-surface rounded-2xl border-2 border-game-yellow/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-game-yellow/20 rounded-xl">
                <Clock className="w-6 h-6 text-game-yellow" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.trialing}</p>
                <p className="text-sm text-muted-foreground">Trial</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 bg-game-surface rounded-2xl border-2 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Crown className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-5 bg-game-surface rounded-2xl border-2 border-destructive/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-destructive/20 rounded-xl">
                <Users className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expirados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Usuários recentes</h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscribers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {subscribers.slice(0, 10).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-4 bg-game-surface rounded-xl border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {sub.full_name || sub.email}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {sub.email}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      sub.subscription_status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : sub.subscription_status === 'trialing'
                        ? 'bg-game-yellow/20 text-game-yellow'
                        : 'bg-destructive/20 text-destructive'
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
    </SiteLayout>
  );
}
