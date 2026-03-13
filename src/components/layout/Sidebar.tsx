import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Gamepad2, Trophy, Users, Swords, Settings,
  LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/', icon: Gamepad2, label: 'Modos de Jogo' },
  { to: '/ranking', icon: Trophy, label: 'Ranking' },
  { to: '/students', icon: Users, label: 'Alunos' },
  { to: '/championship/mat', icon: Swords, label: 'Campeonato' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full border-r border-border bg-card transition-all duration-300 shrink-0',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#9F1239] flex items-center justify-center font-display font-bold text-white text-xl shrink-0">
          S
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-display font-bold text-base tracking-wide leading-tight">S-FIGHT</span>
            <span className="text-[10px] font-semibold text-sfight-red tracking-[0.2em] uppercase leading-tight">PRO</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative group min-h-0',
                isActive
                  ? 'bg-[#E11D48]/15 text-[#E11D48]'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E1E2E]'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#E11D48] rounded-r-full" />
                )}
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-1 shrink-0">
        <button
          onClick={() => { signOut(); navigate('/login'); }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E1E2E] w-full transition-colors min-h-0"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sair</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors min-h-0"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
