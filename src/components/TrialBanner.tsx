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
    <div className="fixed top-0 left-0 right-0 z-40 bg-[#E11D48]/10 border-b border-[#E11D48]/20">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[#E11D48]" />
          <span className="text-white">
            <span className="font-bold font-mono text-[#E11D48]">{daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}</span>
            {' '}restantes no seu trial
          </span>
        </div>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white text-xs font-bold rounded-lg hover:from-[#C81840] hover:to-[#8F1035] transition-colors"
        >
          <Crown className="w-3 h-3" />
          Assinar
        </Link>
      </div>
    </div>
  );
}
