import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Zap, Crown } from 'lucide-react';

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
    'Ver estatisticas',
  ];

  const isSubscribed = subscription.isSubscribed && !subscription.isTrialing;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="font-display font-bold text-2xl md:text-3xl text-white">Plano Pro</h1>
          <p className="text-sm text-[#94A3B8]">Acesso completo a plataforma</p>
        </div>

        {/* Plan Card */}
        <div className="p-6 md:p-8 bg-[#141420] border border-[#F59E0B]/20 rounded-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-[#F59E0B]/10 rounded-xl">
              <Crown className="w-10 h-10 text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-bold text-xl text-white">
                S-FIGHT PRO
              </h2>
              {isSubscribed && (
                <span className="inline-block px-3 py-0.5 mt-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full">
                  Ativo
                </span>
              )}
              {subscription.isTrialing && (
                <span className="inline-block px-3 py-0.5 mt-1 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-bold rounded-full">
                  Em teste
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="text-center py-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-5xl font-bold text-white">R$ 20</span>
              <span className="text-lg text-[#64748B]">/mes</span>
            </div>
            <p className="text-sm text-[#94A3B8] mt-2">
              3 dias gratis para novos usuarios
            </p>
          </div>

          {/* Features */}
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-center gap-3">
                <div className="p-1.5 bg-[#E11D48]/10 rounded-lg">
                  <Check className="w-4 h-4 text-[#E11D48]" />
                </div>
                <span className="text-base text-white">{feature}</span>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="pt-2">
            {isSubscribed ? (
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="w-full h-12 text-base font-bold rounded-xl bg-[#1E1E2E] text-white border border-[#2D2D3F] hover:bg-[#2D2D3F]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    {user ? 'Assinar Agora' : 'Comecar Gratis'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Trial/Subscription Info */}
        {subscription.isTrialing && subscription.trialEndsAt && (
          <p className="text-center text-sm text-[#94A3B8]">
            Seu teste expira em{' '}
            <span className="text-[#F59E0B] font-bold font-mono">
              {Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} dias
            </span>
          </p>
        )}

        {subscription.subscriptionEnd && (
          <p className="text-center text-sm text-[#94A3B8]">
            Proxima cobranca:{' '}
            <span className="text-white font-semibold">
              {subscription.subscriptionEnd.toLocaleDateString('pt-BR')}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
