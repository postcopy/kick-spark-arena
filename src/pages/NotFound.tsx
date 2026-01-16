import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { SiteLayout } from '@/components/layout/SiteLayout';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404 Error: User attempted to access non-existent route:', location.pathname);
  }, [location.pathname]);

  return (
    <SiteLayout 
      title="Página não encontrada" 
      subtitle=""
      showBackButton={false}
      centered
      footer={
        <Link to="/" className="block">
          <Button className="w-full h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl bg-game-yellow text-game-yellow-foreground hover:bg-game-yellow/90">
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Button>
        </Link>
      }
    >
      <div className="text-center space-y-6">
        {/* Emoji grande */}
        <div className="text-8xl md:text-9xl">
          😕
        </div>

        {/* Mensagem */}
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ops!
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Essa página não existe
          </p>
        </div>
      </div>
    </SiteLayout>
  );
};

export default NotFound;
