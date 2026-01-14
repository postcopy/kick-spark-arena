import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Crown, Lock, Zap } from 'lucide-react';

export function Paywall() {
  const { user } = useAuth();

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-50 p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-game-yellow/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-game-yellow" />
        </div>

        <h2 className="text-3xl font-bold text-foreground mb-4">
          Seu acesso expirou
        </h2>

        <p className="text-muted-foreground mb-8">
          {user
            ? 'Seu período de trial terminou. Assine para continuar jogando!'
            : 'Faça login ou cadastre-se para ter acesso ao sistema.'}
        </p>

        <div className="space-y-4">
          {user ? (
            <Link to="/pricing">
              <Button className="w-full bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90">
                <Crown className="w-4 h-4 mr-2" />
                Assinar por R$ 20/mês
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/signup">
                <Button className="w-full bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90">
                  <Zap className="w-4 h-4 mr-2" />
                  Começar Trial de 3 Dias
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Já tenho conta
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
