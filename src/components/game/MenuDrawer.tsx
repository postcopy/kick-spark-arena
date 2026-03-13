import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Menu, X, User, LogOut,
  Usb, Volume2, VolumeX, HelpCircle
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
  serialSupported = true,
}: MenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isMuted, toggleMute } = useSound();

  return (
    <>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-3.5 rounded-xl bg-[#141420]/80 backdrop-blur-sm border border-[#1E1E2E] hover:border-[#E11D48]/40 transition-all active:scale-95"
        aria-label="Abrir menu"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      {/* Portal: Backdrop + Drawer */}
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
              'fixed top-0 right-0 h-full w-80 bg-[#0A0A0F] backdrop-blur-xl border-l border-[#1E1E2E] z-[100] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-out flex flex-col',
              isOpen ? 'translate-x-0' : 'translate-x-full'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1E1E2E]">
              <span className="font-display font-bold text-xl text-white">Menu</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Fechar menu"
              >
                <X className="w-6 h-6 text-[#94A3B8]" />
              </button>
            </div>

            {/* User Section */}
            {user && (
              <div className="p-6 border-b border-[#1E1E2E]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#E11D48]/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-[#E11D48]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-[#64748B] truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {/* Sound Toggle */}
              <button
                onClick={toggleMute}
                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-[#64748B]" />
                ) : (
                  <Volume2 className="w-5 h-5 text-[#E11D48]" />
                )}
                <span className="text-base text-white">
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
                  <Usb className={serialConnected ? 'w-5 h-5 text-green-400' : 'w-5 h-5 text-[#64748B]'} />
                  <div className="flex-1">
                    <span className="text-base text-white">Plaquinha</span>
                    <p className="text-xs text-[#64748B]">
                      {serialConnected ? 'Conectada' : 'Nao conectada'}
                    </p>
                  </div>
                </button>
              )}

              {/* Help */}
              <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors text-left">
                <HelpCircle className="w-5 h-5 text-[#64748B]" />
                <span className="text-base text-white">Ajuda</span>
              </button>
            </div>

            {/* Logout */}
            {user && (
              <div className="shrink-0 p-6 border-t border-[#1E1E2E]">
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setIsOpen(false);
                  }}
                  className="w-full gap-2 h-12 text-base text-[#64748B] hover:text-[#E11D48] hover:bg-[#E11D48]/5"
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
