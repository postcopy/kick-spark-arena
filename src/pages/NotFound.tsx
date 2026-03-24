import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-6 text-center">
      <div className="p-5 bg-[#E11D48]/10 rounded-2xl">
        <AlertTriangle className="w-14 h-14 text-[#E11D48]" />
      </div>

      <div className="space-y-2">
        <h2 className="font-display font-bold text-3xl text-white">Ops! Página não encontrada</h2>
        <p className="text-[#94A3B8] text-lg">Parece que essa página não existe ou foi movida.</p>
        <p className="text-[#64748B] text-sm">Verifique o endereço ou volte para a tela inicial.</p>
      </div>

      <Link to="/">
        <Button className="h-12 px-8 text-base font-bold rounded-xl bg-gradient-to-r from-[#E11D48] to-[#9F1239] text-white hover:from-[#C81840] hover:to-[#8F1035] shadow-lg shadow-[#E11D48]/20">
          <Home className="w-5 h-5 mr-2" />
          Voltar ao Início
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
