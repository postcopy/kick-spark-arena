import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import { SiteLayout } from '@/components/layout/SiteLayout';
import logo from '@/assets/logo-desafio-relampago.png';

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
    <SiteLayout 
      title="Entrar" 
      subtitle="Entre para jogar"
      backTo="/"
      footer={
        <p className="text-center text-base md:text-lg text-muted-foreground">
          Não tem conta?{' '}
          <Link to="/signup" className="text-game-yellow hover:underline font-semibold">
            Cadastre-se grátis
          </Link>
        </p>
      }
    >
      <div className="space-y-6 md:space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={logo} 
            alt="Desafio Relâmpago" 
            className="h-20 md:h-24 w-auto mx-auto" 
          />
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base md:text-lg">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-14 text-lg px-4 rounded-xl bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-base md:text-lg">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-14 text-lg px-4 rounded-xl bg-secondary border-border"
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl text-destructive text-base">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
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
      </div>
    </SiteLayout>
  );
}
