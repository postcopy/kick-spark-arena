import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, ArrowLeft } from 'lucide-react';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </Link>

        <div className="text-center mb-8">
          <img src={logo} alt="Desafio Relâmpago" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Entrar</h1>
          <p className="text-muted-foreground mt-2">Acesse sua conta para jogar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-secondary border-border"
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Entrar
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6">
          Não tem conta?{' '}
          <Link to="/signup" className="text-game-yellow hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
