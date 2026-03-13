import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Paywall } from '@/components/Paywall';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireAuth?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireAuth = true }: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, subscription } = useAuth();

  if (isLoading || subscription.isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If auth is required and user exists, check subscription
  if (requireAuth && user) {
    const canPlay = isAdmin || subscription.isSubscribed || subscription.isTrialing;
    if (!canPlay) {
      return <Paywall />;
    }
  }

  return <>{children}</>;
}
