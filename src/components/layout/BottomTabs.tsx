import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Trophy, Users, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/', icon: Gamepad2, label: 'Jogar', highlight: true },
  { to: '/students', icon: Users, label: 'Alunos' },
  { to: '/championship/mat', icon: MoreHorizontal, label: 'Mais' },
];

export function BottomTabs() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141420] border-t border-[#1E1E2E] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors min-h-0 flex-1',
                isActive ? 'text-[#E11D48]' : 'text-[#94A3B8]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {tab.highlight ? (
                  <div className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center -mt-6 border-4 border-[#0A0A0F]',
                    isActive
                      ? 'bg-gradient-to-br from-[#E11D48] to-[#9F1239]'
                      : 'bg-gradient-to-br from-[#E11D48]/80 to-[#9F1239]/80',
                    'text-white shadow-lg shadow-[#E11D48]/20'
                  )}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                ) : (
                  <tab.icon className="w-5 h-5" />
                )}
                <span className={cn(
                  "text-[10px] font-semibold",
                  tab.highlight && "-mt-0.5"
                )}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
