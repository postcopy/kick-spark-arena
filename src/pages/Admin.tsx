import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, Crown, Clock, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-desafio-relampago.png';

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
      // Admins can view all profiles via RLS policy
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

      // Calculate stats
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-game-yellow" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <img src={logo} alt="Desafio Relâmpago" className="h-10 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
              <p className="text-sm text-muted-foreground">Gerenciar assinantes</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/sounds">
              <Button variant="outline" size="sm">
                <Volume2 className="w-4 h-4 mr-2" />
                Sons
              </Button>
            </Link>
            <Button onClick={fetchSubscribers} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-game-surface rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-game-surface rounded-lg border border-game-yellow/30">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-game-yellow" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.trialing}</p>
                <p className="text-sm text-muted-foreground">Em Trial</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-game-surface rounded-lg border border-green-500/30">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-game-surface rounded-lg border border-destructive/30">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expirados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="bg-game-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Nome</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Trial Expira</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Nenhum assinante encontrado
                    </td>
                  </tr>
                ) : (
                  subscribers.map((sub) => (
                    <tr key={sub.id} className="border-b border-border/50 hover:bg-secondary/50">
                      <td className="p-4 text-foreground">{sub.email}</td>
                      <td className="p-4 text-foreground">{sub.full_name || '-'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
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
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(sub.trial_ends_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
