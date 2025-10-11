import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Browse from "./pages/Browse";
import CampaignDetails from "./pages/CampaignDetails";
import StartCampaign from "./pages/StartCampaign";
import EditCampaign from "./pages/EditCampaign";
import AdminEditCampaign from "./pages/AdminEditCampaign";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import UserManagement from "./pages/UserManagement";
import CampaignManagement from "./pages/CampaignManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WalletProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/campaign/:id" element={<CampaignDetails />} />
              <Route path="/campaign/:id/edit" element={<EditCampaign />} />
              <Route path="/admin/campaigns/:id/edit" element={<AdminEditCampaign />} />
              <Route path="/start-campaign" element={<StartCampaign />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/campaigns" element={<CampaignManagement />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
