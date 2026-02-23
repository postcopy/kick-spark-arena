import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
import AdminSounds from "./pages/AdminSounds";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";
import ChampionshipMat from "./pages/ChampionshipMat";
import ChampionshipTV from "./pages/ChampionshipTV";
import Students from "./pages/Students";
import StudentProfile from "./pages/StudentProfile";

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
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SoundProvider>
        <SerialPortProvider>
          <TooltipProvider>
            <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/admin/sounds" element={<ProtectedRoute requireAdmin><AdminSounds /></ProtectedRoute>} />
              <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
              <Route path="/championship/mat" element={<ProtectedRoute><ChampionshipMat /></ProtectedRoute>} />
              <Route path="/championship/tv" element={<ProtectedRoute><ChampionshipTV /></ProtectedRoute>} />
              <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
              <Route path="/students/:id" element={<ProtectedRoute><StudentProfile /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </SerialPortProvider>
      </SoundProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
