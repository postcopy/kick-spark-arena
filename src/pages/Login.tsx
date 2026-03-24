import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, LogIn, ArrowLeft } from 'lucide-react';

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials': 'Email ou senha incorretos. Tente novamente.',
  'Email not confirmed': 'Email ainda não confirmado. Verifique sua caixa de entrada.',
  'User not found': 'Nenhuma conta encontrada com este email.',
  'Too many requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const translateError = (message: string) => ERROR_MESSAGES[message] || message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(translateError(error.message));
      setIsLoading(false);
    } else {
      navigate('/');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email acima para recuperar a senha.');
      return;
    }
    setIsResetting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setError(translateError(error.message));
      } else {
        setResetSent(true);
      }
    } catch {
      setError('Erro ao enviar email de recuperação.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden relative bg-[#0A0A0F]">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#E11D48]/8 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#E11D48]/5 blur-[100px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-[#F59E0B]/4 blur-[80px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Back button */}
      <header className="relative z-10 flex-shrink-0 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="h-12 w-12 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </header>

      {/* Centered card */}
      <main className="relative z-10 flex-1 min-h-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Branding */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E11D48] to-[#9F1239] shadow-lg shadow-[#E11D48]/20 mx-auto">
              <span className="font-display font-bold text-white text-3xl">S</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-3xl tracking-wide text-white">S-FIGHT <span className="text-[#E11D48]">PRO</span></h1>
              <p className="text-sm text-[#94A3B8] mt-1 font-medium">Plataforma de Treinamento Profissional</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#141420]/80 border border-[#1E1E2E] rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-sm">
            <div>
              <h2 className="font-display font-bold text-xl text-white">Entrar na conta</h2>
              <p className="text-sm text-[#94A3B8] mt-1">Acesse sua academia</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#94A3B8] text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="h-12 text-base px-4 rounded-xl bg-[#1E1E2E] border-[#2D2D3F] text-white placeholder:text-[#4A4A5A] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]/30 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[#94A3B8] text-sm font-semibold">Senha</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResetting}
                    className="text-xs text-[#E11D48] hover:text-[#F43F5E] hover:underline font-semibold transition-colors disabled:opacity-50"
                  >
                    {isResetting ? 'Enviando...' : 'Esqueci minha senha'}
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 text-base px-4 rounded-xl bg-[#1E1E2E] border-[#2D2D3F] text-white placeholder:text-[#4A4A5A] focus:border-[#E11D48] focus:ring-1 focus:ring-[#E11D48]/30 transition-all"
                />
              </div>

              {resetSent && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium">
                  Email de recuperação enviado! Verifique sua caixa de entrada.
                </div>
              )}

              {error && (
                <div className="p-3 bg-[#E11D48]/10 border border-[#E11D48]/30 rounded-xl text-[#E11D48] text-sm font-medium">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20 transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="text-center text-sm text-[#94A3B8]">
            Não tem conta?{' '}
            <Link to="/signup" className="text-[#E11D48] hover:text-[#F43F5E] hover:underline font-bold transition-colors">
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
