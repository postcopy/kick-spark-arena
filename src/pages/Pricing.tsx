import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, Zap, Crown } from 'lucide-react';
import logo from '@/assets/logo-desafio-relampago.png';

export default function Pricing() {
  const { user, session, subscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!session?.access_token) {
      window.location.href = '/signup';
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!session?.access_token) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      console.error('Error opening customer portal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    'Modo Time Attack ilimitado',
    'Modo Arcade Duel completo',
    'Conexão com plaquinha serial',
    'Estatísticas de jogo',
    'Suporte prioritário',
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-lg">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <div className="text-center mb-8">
          <img src={logo} alt="Desafio Relâmpago" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Plano Pro</h1>
          <p className="text-muted-foreground mt-2">Acesso completo ao sistema</p>
        </div>

        <div className="bg-game-surface border-2 border-game-yellow/30 rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-game-yellow" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Desafio Relâmpago Pro</h2>
                <p className="text-sm text-muted-foreground">Mensal</p>
              </div>
            </div>
            {subscription.isSubscribed && !subscription.isTrialing && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">Ativo</span>
            )}
            {subscription.isTrialing && (
              <span className="px-3 py-1 bg-game-yellow/20 text-game-yellow text-sm rounded-full">Trial</span>
            )}
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">R$ 20</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">3 dias grátis para novos usuários</p>
          </div>

          <ul className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-game-yellow flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          {subscription.isSubscribed && !subscription.isTrialing ? (
            <Button
              onClick={handleManageSubscription}
              disabled={isLoading}
              className="w-full bg-secondary hover:bg-secondary/80"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                'Gerenciar Assinatura'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {user ? 'Assinar Agora' : 'Começar Trial Grátis'}
                </>
              )}
            </Button>
          )}
        </div>

        {subscription.isTrialing && subscription.trialEndsAt && (
          <p className="text-center text-sm text-muted-foreground">
            Seu trial expira em{' '}
            <span className="text-game-yellow font-semibold">
              {Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
            </span>
          </p>
        )}

        {subscription.subscriptionEnd && (
          <p className="text-center text-sm text-muted-foreground">
            Próxima cobrança:{' '}
            <span className="text-foreground font-semibold">
              {subscription.subscriptionEnd.toLocaleDateString('pt-BR')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
