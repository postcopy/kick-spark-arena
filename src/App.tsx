import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TrialBanner } from "@/components/TrialBanner";
import { Loader2 } from "lucide-react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import { IdleScreensaver } from "./components/IdleScreensaver";

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminSounds = lazy(() => import('./pages/AdminSounds'));
const Ranking = lazy(() => import('./pages/Ranking'));
const Settings = lazy(() => import('./pages/Settings'));
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

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ErrorBoundary fallbackMessage="Erro ao inicializar. Recarregue a página.">
      <SoundProvider>
          <SerialPortProvider>
            <TooltipProvider>
              <Toaster />
            <Sonner />
            <HashRouter>
              <TrialBanner />
              <Suspense fallback={<div className="flex items-center justify-center h-[100dvh] bg-[#0A0A0F]"><Loader2 className="w-8 h-8 text-[#E11D48] animate-spin" /></div>}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AppShell><Admin /></AppShell></ProtectedRoute>} />
                <Route path="/admin/sounds" element={<ProtectedRoute requireAdmin><AppShell><AdminSounds /></AppShell></ProtectedRoute>} />
                <Route path="/ranking" element={<ProtectedRoute><AppShell><Ranking /></AppShell></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><AppShell><Students /></AppShell></ProtectedRoute>} />
                <Route path="/students/:id" element={<ProtectedRoute><AppShell><StudentProfile /></AppShell></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><AppShell><Settings /></AppShell></ProtectedRoute>} />
                <Route path="/register" element={<PublicRegistration />} />
                <Route path="/live" element={<LiveScore />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
            </HashRouter>
            <IdleScreensaver />
            </TooltipProvider>
          </SerialPortProvider>
      </SoundProvider>
      </ErrorBoundary>
    </AuthProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
