import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, ArrowLeft } from 'lucide-react';
import logo from '@/assets/logo-desafio-relampago.png';
import bgArena from '@/assets/bg-arena.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden relative">
      {/* Background with blur */}
      <img 
        src={bgArena} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover blur-sm scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />

      {/* Back button */}
      <header className="relative z-10 flex-shrink-0 p-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/')}
          className="h-12 w-12 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img 
              src={logo} 
              alt="Desafio Relâmpago" 
              className="h-20 md:h-24 w-auto mx-auto drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]" 
            />
            <p className="text-sm text-white/50 mt-2">Entre para jogar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-14 text-lg px-4 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-14 text-lg px-4 rounded-xl bg-white/10 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 text-lg font-bold rounded-xl bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-white/50">
            Não tem conta?{' '}
            <Link to="/signup" className="text-game-yellow hover:underline font-semibold">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
