import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap, Gift } from 'lucide-react';
import { SiteLayout } from '@/components/layout/SiteLayout';
import logo from '@/assets/logo-desafio-relampago.png';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <SiteLayout 
      title="Criar Conta" 
      subtitle="Teste grátis por 3 dias!"
      backTo="/"
      footer={
        <div className="space-y-2 text-center">
          <p className="text-base md:text-lg text-muted-foreground">
            Já tem conta?{' '}
            <Link to="/login" className="text-game-yellow hover:underline font-semibold">
              Entre aqui
            </Link>
          </p>
          <p className="text-sm text-muted-foreground">
            Depois do trial: R$ 20/mês
          </p>
        </div>
      }
    >
      <div className="space-y-6 md:space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={logo} 
            alt="Desafio Relâmpago" 
            className="h-16 md:h-20 w-auto mx-auto" 
          />
        </div>

        {/* Card de Trial */}
        <div className="p-4 md:p-6 bg-game-yellow/10 border-2 border-game-yellow/30 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-game-yellow/20 rounded-xl">
              <Gift className="w-8 h-8 text-game-yellow" />
            </div>
            <div>
              <p className="font-bold text-lg md:text-xl text-foreground">Teste grátis 3 dias!</p>
              <p className="text-base text-muted-foreground">Acesso completo, sem compromisso</p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-base md:text-lg">
              Seu nome
            </Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Como você quer ser chamado?"
              className="h-14 text-lg px-4 rounded-xl bg-secondary border-border"
            />
          </div>

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
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
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
                Criando conta...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Começar Grátis
              </>
            )}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
