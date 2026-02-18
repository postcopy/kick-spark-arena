import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { SerialPortProvider } from "@/contexts/SerialPortContext";
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

const queryClient = new QueryClient();

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
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/sounds" element={<AdminSounds />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/championship/mat" element={<ChampionshipMat />} />
              <Route path="/championship/tv" element={<ChampionshipTV />} />
              <Route path="/students" element={<Students />} />
              <Route path="/students/:id" element={<StudentProfile />} />
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
