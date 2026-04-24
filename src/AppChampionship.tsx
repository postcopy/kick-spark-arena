import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrialBanner } from "@/components/TrialBanner";
import { Loader2 } from "lucide-react";
import ModeSelectorPage from "./pages/ModeSelectorPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { UpdateNotification } from "./components/UpdateNotification";

const ChampionshipMat = lazy(() => import('./pages/ChampionshipMat'));
const ChampionshipHub = lazy(() => import('./pages/ChampionshipHub'));
const ChampionshipTV = lazy(() => import('./pages/ChampionshipTV'));
const TournamentSetup = lazy(() => import('./pages/TournamentSetup'));
const CentralPage = lazy(() => import('./pages/CentralPage'));
const ChamadaPage = lazy(() => import('./pages/ChamadaPage'));
const ProfessionalSelectorPage = lazy(() => import('./pages/ProfessionalSelectorPage'));
const DemoSetupPage = lazy(() => import('./pages/DemoSetupPage'));
const HelpPage = lazy(() => import('./pages/HelpPage'));
const PublicRegistration = lazy(() => import('./pages/PublicRegistration'));
const LiveScore = lazy(() => import('./pages/LiveScore'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 60 * 24,
      retry: false,
    },
  },
});

const AppChampionship = () => (
  <ErrorBoundary fallbackMessage="Erro critico. Recarregue a pagina.">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary fallbackMessage="Erro no sistema de audio.">
          <SoundProvider>
            <ErrorBoundary fallbackMessage="Erro no modulo de hardware.">
              <SerialPortProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <UpdateNotification />
                  <HashRouter>
                    <TrialBanner />
                    <Suspense fallback={<div className="flex items-center justify-center h-[100dvh] bg-[#0A0A0F]"><Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" /></div>}>
                      <Routes>
                        <Route path="/" element={<ModeSelectorPage />} />
                        <Route path="/professional" element={<ProfessionalSelectorPage />} />
                        <Route path="/central" element={<CentralPage />} />
                        <Route path="/championship/hub" element={<ChampionshipHub />} />
                        <Route path="/championship/mat" element={<ChampionshipMat />} />
                        <Route path="/championship/tv" element={<ChampionshipTV />} />
                        <Route path="/championship/tournament" element={<TournamentSetup />} />
                        <Route path="/chamada" element={<ChamadaPage />} />
                        <Route path="/live" element={<LiveScore />} />
                        <Route path="/demo" element={<DemoSetupPage />} />
                        <Route path="/help" element={<HelpPage />} />
                        <Route path="/register" element={<PublicRegistration />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </HashRouter>
                </TooltipProvider>
              </SerialPortProvider>
            </ErrorBoundary>
          </SoundProvider>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default AppChampionship;
