import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import MissionDiscovery from "./pages/MissionDiscovery";
import OrganisationDashboard from "./pages/OrganisationDashboard";
import CreateMission from "./pages/CreateMission";
import VolunteerProfile from "./pages/VolunteerProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TeamManagement from "./pages/TeamManagement";

const queryClient = new QueryClient();

function App() {
  // Set dark mode by default
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/*" element={
                <Layout>
                  <Routes>
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/missions" element={
                      <ProtectedRoute>
                        <MissionDiscovery />
                      </ProtectedRoute>
                    } />
                    <Route path="/org-dashboard" element={
                      <ProtectedRoute requiredRoles={['organization_owner', 'team_member']}>
                        <OrganisationDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/org-dashboard/missions/new" element={
                      <ProtectedRoute requiredRoles={['organization_owner', 'team_member']}>
                        <CreateMission />
                      </ProtectedRoute>
                    } />
                    <Route path="/team" element={
                      <ProtectedRoute requiredRoles={['organization_owner', 'team_member']}>
                        <TeamManagement />
                      </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <VolunteerProfile />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute requiredRoles={['super_admin']}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
