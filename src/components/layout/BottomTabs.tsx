import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Gamepad2, Trophy, Users, MoreHorizontal, Settings, Crown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/', icon: Gamepad2, label: 'Jogar', highlight: true },
  { to: '/students', icon: Users, label: 'Atletas' },
];

const MORE_OPTIONS = [
  { to: '/settings', icon: Settings, label: 'Configurações' },
  { to: '/pricing', icon: Crown, label: 'Preços' },
];

export function BottomTabs() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <nav role="navigation" aria-label="Menu inferior" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#141420] border-t border-[#1E1E2E] safe-area-bottom">
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

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex flex-col items-center gap-0.5 py-1 px-2 rounded-lg transition-colors min-h-0 flex-1',
              open ? 'text-[#E11D48]' : 'text-[#94A3B8]',
            )}>
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-semibold">Mais</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={8}
            className="w-48 p-1 bg-[#141420] border-[#1E1E2E] text-white"
          >
            {MORE_OPTIONS.map((option) => (
              <button
                key={option.to}
                onClick={() => { setOpen(false); navigate(option.to); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-[#94A3B8] hover:text-white hover:bg-[#1E1E2E] transition-colors"
              >
                <option.icon className="w-4 h-4" />
                {option.label}
              </button>
            ))}
            <div className="border-t border-[#1E1E2E] mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm text-[#E11D48] hover:text-white hover:bg-[#E11D48]/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
