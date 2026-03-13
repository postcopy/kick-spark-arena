import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ModeSelectorPage from "./pages/ModeSelectorPage";
import ChampionshipMat from "./pages/ChampionshipMat";
import ChampionshipTV from "./pages/ChampionshipTV";
import TournamentSetup from "./pages/TournamentSetup";
import CentralPage from "./pages/CentralPage";
import ChamadaPage from "./pages/ChamadaPage";
import ProfessionalSelectorPage from "./pages/ProfessionalSelectorPage";
import DemoSetupPage from "./pages/DemoSetupPage";
import HelpPage from "./pages/HelpPage";
import PublicRegistration from "./pages/PublicRegistration";

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
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SoundProvider>
        <SerialPortProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/" element={<ModeSelectorPage />} />
                <Route path="/professional" element={<ProfessionalSelectorPage />} />
                <Route path="/central" element={<CentralPage />} />
                <Route path="/championship/mat" element={<ChampionshipMat />} />
                <Route path="/championship/tv" element={<ChampionshipTV />} />
                <Route path="/championship/tournament" element={<TournamentSetup />} />
                <Route path="/chamada" element={<ChamadaPage />} />
                <Route path="/demo" element={<DemoSetupPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/register" element={<PublicRegistration />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </SerialPortProvider>
      </SoundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default AppChampionship;
