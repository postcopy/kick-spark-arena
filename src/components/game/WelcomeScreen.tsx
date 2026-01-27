import { Link } from 'react-router-dom';
import { Zap, LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoSfighter from '@/assets/logo-sfighter.png';
import bgArena from '@/assets/bg-arena.jpg';
export function WelcomeScreen() {
  return <div className="relative h-full w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${bgArena})`
    }} />
      
      {/* Overlay gradiente para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
      
      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-full items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
          
          {/* Logo S-Fighter */}
          <img src={logoSfighter} alt="S-Fighter" className="h-24 md:h-32 lg:h-40 w-auto drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" />
          
          {/* Descrição */}
          <div className="space-y-2">
            
            <p className="text-base text-white/80 text-center md:text-2xl">
              Conecte seus equipamentos e dispute com amigos em batalhas épicas!
            </p>
          </div>
          
          {/* Botões */}
          <div className="w-full space-y-3 pt-4">
            <Link to="/login" className="block w-full">
              <Button size="lg" className="w-full h-14 md:h-16 text-lg font-bold rounded-xl 
                           bg-game-yellow text-background hover:bg-game-yellow/90">
                <LogIn className="w-5 h-5 mr-2" />
                Entrar
              </Button>
            </Link>
            
            <Link to="/signup" className="block w-full">
              <Button size="lg" variant="outline" className="w-full h-14 md:h-16 text-lg font-bold rounded-xl
                           bg-white/10 border-white/30 text-white hover:bg-white/20">
                <UserPlus className="w-5 h-5 mr-2" />
                Criar Conta Grátis
              </Button>
            </Link>
          </div>
          
          {/* Badge de trial */}
          <div className="flex items-center gap-2 text-game-yellow text-sm">
            <Zap className="w-4 h-4" />
            <span>3 dias grátis para testar!</span>
          </div>
        </div>
      </div>
    </div>;
}