import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Zap, Crown } from 'lucide-react';
import { SiteLayout } from '@/components/layout/SiteLayout';

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
    'Jogar sem limites',
    'Todos os modos de jogo',
    'Conectar a plaquinha',
    'Ver estatísticas',
  ];

  const isSubscribed = subscription.isSubscribed && !subscription.isTrialing;

  return (
    <SiteLayout 
      title="Plano Pro" 
      subtitle="Acesso completo"
      backTo="/"
      footer={
        isSubscribed ? (
          <Button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl"
            variant="secondary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              'Ver minha conta'
            )}
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                {user ? 'Assinar Agora' : 'Começar Grátis'}
              </>
            )}
          </Button>
        )
      }
    >
      <div className="space-y-6 md:space-y-8">
        {/* Card Principal do Plano */}
        <div className="p-6 md:p-8 bg-game-surface border-2 border-game-yellow/30 rounded-2xl space-y-6">
          {/* Header do Card */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-game-yellow/20 rounded-xl">
              <Crown className="w-10 h-10 text-game-yellow" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Desafio Relâmpago Pro
              </h2>
              {isSubscribed && (
                <span className="inline-block px-3 py-1 mt-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                  Ativo
                </span>
              )}
              {subscription.isTrialing && (
                <span className="inline-block px-3 py-1 mt-1 bg-game-yellow/20 text-game-yellow text-sm rounded-full">
                  Em teste
                </span>
              )}
            </div>
          </div>

          {/* Preço */}
          <div className="text-center py-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl md:text-6xl font-bold text-foreground">R$ 20</span>
              <span className="text-xl text-muted-foreground">/mês</span>
            </div>
            <p className="text-base text-muted-foreground mt-2">
              3 dias grátis para novos usuários
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-4">
                <div className="p-2 bg-game-yellow/20 rounded-lg">
                  <Check className="w-5 h-5 text-game-yellow" />
                </div>
                <span className="text-lg text-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info de Trial/Assinatura */}
        {subscription.isTrialing && subscription.trialEndsAt && (
          <p className="text-center text-base text-muted-foreground">
            Seu teste expira em{' '}
            <span className="text-game-yellow font-semibold">
              {Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
            </span>
          </p>
        )}

        {subscription.subscriptionEnd && (
          <p className="text-center text-base text-muted-foreground">
            Próxima cobrança:{' '}
            <span className="text-foreground font-semibold">
              {subscription.subscriptionEnd.toLocaleDateString('pt-BR')}
            </span>
          </p>
        )}
      </div>
    </SiteLayout>
  );
}
