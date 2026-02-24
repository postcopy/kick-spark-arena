import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { 
  Menu, X, User, LogIn, LogOut, Crown, Settings, 
  Trophy, Usb, Volume2, VolumeX, HelpCircle, BarChart3 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { cn } from '@/lib/utils';

interface MenuDrawerProps {
  serialConnected?: boolean;
  onConnectSerial?: () => void;
  onDisconnectSerial?: () => void;
  serialSupported?: boolean;
}

export function MenuDrawer({ 
  serialConnected, 
  onConnectSerial, 
  onDisconnectSerial,
  serialSupported = true 
}: MenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { isMuted, toggleMute } = useSound();

  return (
    <>
      {/* Menu Button - Always Visible */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-4 rounded-2xl bg-game-surface/80 backdrop-blur-sm border border-border hover:border-game-yellow/50 transition-all active:scale-95"
        aria-label="Abrir menu"
      >
        <Menu className="w-7 h-7 text-foreground" />
      </button>

      {/* Portal: Backdrop + Drawer rendered on document.body */}
      {createPortal(
        <>
          {isOpen && (
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] animate-fade-in"
              onClick={() => setIsOpen(false)}
            />
          )}
          <div 
            className={cn(
              'fixed top-0 right-0 h-full w-80 bg-[#0b1120] backdrop-blur-xl border-l border-border z-[100] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out flex flex-col',
              isOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <span className="text-xl font-bold text-foreground">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
            </div>

            {/* User Section */}
            {user && (
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-game-yellow/20 flex items-center justify-center">
                    <User className="w-6 h-6 text-game-yellow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Sound Toggle */}
              <button
                onClick={toggleMute}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                {isMuted ? (
                  <VolumeX className="w-6 h-6 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-6 h-6 text-game-yellow" />
                )}
                <span className="text-lg text-foreground">
                  Som: {isMuted ? 'Desligado' : 'Ligado'}
                </span>
              </button>

              {/* Serial Port */}
              {serialSupported && (
                <button
                  onClick={() => {
                    if (serialConnected) {
                      onDisconnectSerial?.();
                    } else {
                      onConnectSerial?.();
                    }
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <Usb className={serialConnected ? "w-6 h-6 text-green-500" : "w-6 h-6 text-muted-foreground"} />
                  <div className="flex-1">
                    <span className="text-lg text-foreground">Plaquinha</span>
                    <p className="text-sm text-muted-foreground">
                      {serialConnected ? 'Conectada ✓' : 'Não conectada'}
                    </p>
                  </div>
                </button>
              )}

              {/* Dashboard */}
              {user && (
                <Link 
                  to="/dashboard" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                  <span className="text-lg text-foreground">Dashboard</span>
                </Link>
              )}

              {/* Ranking */}
              {user && (
                <Link 
                  to="/ranking" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Trophy className="w-6 h-6 text-game-gold" />
                  <span className="text-lg text-foreground">Ranking</span>
                </Link>
              )}


              {/* Admin */}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Settings className="w-6 h-6 text-muted-foreground" />
                  <span className="text-lg text-foreground">Admin</span>
                </Link>
              )}

              {/* Pricing/Plan */}
              {user && (
                <Link 
                  to="/pricing" 
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <Crown className="w-6 h-6 text-game-yellow" />
                  <span className="text-lg text-foreground">Meu Plano</span>
                </Link>
              )}

              {/* Help */}
              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left">
                <HelpCircle className="w-6 h-6 text-muted-foreground" />
                <span className="text-lg text-foreground">Ajuda</span>
              </button>
            </div>

            {/* Logout */}
            {user && (
              <div className="shrink-0 p-6 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full gap-2 h-14 text-lg text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-5 h-5" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
