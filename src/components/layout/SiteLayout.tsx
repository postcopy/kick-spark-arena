import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SiteLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backTo?: string;
  showBackButton?: boolean;
  centered?: boolean;
}

export function SiteLayout({ 
  title, 
  subtitle, 
  children, 
  footer, 
  backTo = '/',
  showBackButton = true,
  centered = false,
}: SiteLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background">
      {/* Header - sempre visível, fixo no topo */}
      <header className="flex-shrink-0 p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-4 max-w-2xl mx-auto">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(backTo)}
              className="h-12 w-12 rounded-xl"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-base md:text-lg text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Main - área principal com scroll se precisar */}
      <main className={`flex-1 min-h-0 overflow-y-auto p-4 md:p-6 ${centered ? 'flex items-center justify-center' : ''}`}>
        <div className={`w-full max-w-2xl mx-auto ${centered ? '' : ''}`}>
          {children}
        </div>
      </main>

      {/* Footer - só renderiza se tiver conteúdo */}
      {footer && (
        <footer className="flex-shrink-0 p-4 md:p-6 border-t border-border bg-background">
          <div className="max-w-2xl mx-auto">
            {footer}
          </div>
        </footer>
      )}
    </div>
  );
}
