import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Zap } from 'lucide-react';

export function Paywall() {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-[#0A0A0F]/95 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#E11D48]/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#E11D48]" />
        </div>

        <h2 className="font-display font-bold text-3xl text-white mb-4">
          Seu acesso expirou
        </h2>

        <p className="text-[#94A3B8] mb-8">
          {user
            ? 'Seu periodo de trial terminou. Assine para continuar jogando!'
            : 'Faca login ou cadastre-se para ter acesso ao sistema.'}
        </p>

        <div className="space-y-3">
          {user ? (
            <Link to="/pricing">
              <Button className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20">
                <Crown className="w-4 h-4 mr-2" />
                Assinar por R$ 20/mes
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signup">
                <Button className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20">
                  <Zap className="w-4 h-4 mr-2" />
                  Comecar Trial de 3 Dias
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" className="w-full h-12 text-base text-[#94A3B8] hover:text-white hover:bg-white/5">
                  Ja tenho conta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
