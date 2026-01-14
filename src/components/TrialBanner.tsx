import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Crown } from 'lucide-react';

export function TrialBanner() {
  const { subscription } = useAuth();

  if (!subscription.isTrialing || !subscription.trialEndsAt) {
    return null;
  }

  const daysLeft = Math.ceil(
    (subscription.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-game-yellow/10 border-b border-game-yellow/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-game-yellow" />
          <span className="text-foreground">
            <span className="font-semibold text-game-yellow">{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</span>
            {' '}restantes no seu trial
          </span>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 px-3 py-1 bg-game-yellow text-game-yellow-foreground text-sm font-medium rounded hover:bg-game-yellow/90 transition-colors"
        >
          <Crown className="w-3 h-3" />
          Assinar agora
        </Link>
      </div>
    </div>
  );
}
