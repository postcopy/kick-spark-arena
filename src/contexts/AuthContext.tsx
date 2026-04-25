import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface SubscriptionStatus {
  isSubscribed: boolean;
  isTrialing: boolean;
  trialEndsAt: Date | null;
  subscriptionEnd: Date | null;
  isLoading: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  subscription: SubscriptionStatus;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkSubscription: (isInitial?: boolean) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isSubscribed: false,
    isTrialing: false,
    trialEndsAt: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!data);
    } catch (err) {
      console.error('Error checking admin role:', err);
      setIsAdmin(false);
    }
  }, []);

  const checkSubscription = useCallback(async (isInitial = false) => {
    // UI-AUDIT R8-H5: le session/token via getSession() em vez de fechar sobre
    // session do closure. setInterval recriava checkSubscription a cada token
    // refresh, mas o intervalo capturado mantinha funcao velha — invoke ia
    // com Bearer ${token-velho} mesmo apos rotacao, dando 401 silencioso.
    // getSession() pega sempre o token atual do client supabase.
    const { data: { session: liveSession } } = await supabase.auth.getSession();
    if (!liveSession?.access_token || !liveSession.user) {
      setSubscription({
        isSubscribed: false,
        isTrialing: false,
        trialEndsAt: null,
        subscriptionEnd: null,
        isLoading: false,
      });
      return;
    }

    try {
      // Only show loading on initial check, not periodic refreshes
      if (isInitial) {
        setSubscription(prev => ({ ...prev, isLoading: true }));
      }

      // First, check trial status from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_ends_at')
        .eq('id', liveSession.user.id)
        .single();

      const trialEndsAt = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
      const isTrialing = trialEndsAt ? trialEndsAt > new Date() : false;

      // Then check Stripe subscription
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${liveSession.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        // If error, still use trial status
        setSubscription({
          isSubscribed: isTrialing,
          isTrialing,
          trialEndsAt,
          subscriptionEnd: null,
          isLoading: false,
        });
        return;
      }

      setSubscription({
        isSubscribed: data.subscribed || isTrialing,
        isTrialing: !data.subscribed && isTrialing,
        trialEndsAt,
        subscriptionEnd: data.subscription_end ? new Date(data.subscription_end) : null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  }, [session?.access_token, user?.id]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => {
            checkAdminRole(session.user.id);
            checkSubscription(false); // Non-blocking: initial load covered by getSession
          }, 0);
        } else {
          setIsAdmin(false);
          setSubscription({
            isSubscribed: false,
            isTrialing: false,
            trialEndsAt: null,
            subscriptionEnd: null,
            isLoading: false,
          });
        }
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        checkAdminRole(session.user.id);
        checkSubscription(true); // Initial check - show loading
      }
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, [checkAdminRole, checkSubscription]);

  // Periodic subscription check
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      checkSubscription(false); // Periodic check - no loading screen
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName || '',
          },
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const loginAttemptsRef = useRef(0);
  const lastLoginAttemptRef = useRef(0);

  const signIn = async (email: string, password: string) => {
    const now = Date.now();
    // Reset counter after 5 minutes
    if (now - lastLoginAttemptRef.current > 5 * 60 * 1000) {
      loginAttemptsRef.current = 0;
    }
    loginAttemptsRef.current++;
    lastLoginAttemptRef.current = now;

    if (loginAttemptsRef.current > 5) {
      return { error: new Error('Muitas tentativas de login. Aguarde 5 minutos.') };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setSubscription({
      isSubscribed: false,
      isTrialing: false,
      trialEndsAt: null,
      subscriptionEnd: null,
      isLoading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        subscription,
        signUp,
        signIn,
        signOut,
        checkSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
