import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AdminGuard, PartnerGuard, ReportsGuard } from "@/components/auth/RouteGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Admin Pages
import Index from "./pages/Index";
import Partners from "./pages/Partners";
import PartnerDetail from "./pages/PartnerDetail";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import Publish from "./pages/Publish";
import Segments from "./pages/Segments";
import Reports from "./pages/Reports";
import QubeTalk from "./pages/QubeTalk";
import NotFound from "./pages/NotFound";

// Partner Pages
import PartnerHome from "./pages/partner/PartnerHome";
import PartnerPacksList from "./pages/partner/PartnerPacksList";
import PartnerPackDetail from "./pages/partner/PartnerPackDetail";
import PartnerCampaignCatalog from "./pages/partner/PartnerCampaignCatalog";
import PartnerCampaignDetail from "./pages/partner/PartnerCampaignDetail";
import PartnerProposeCampaign from "./pages/partner/PartnerProposeCampaign";
import PartnerReports from "./pages/partner/PartnerReports";
import PartnerSettings from "./pages/partner/PartnerSettings";
import PartnerQubeTalk from "./pages/partner/PartnerQubeTalk";

const queryClient = new QueryClient();

function RootRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const mode = params.get('mode');
  const to = mode === 'admin' ? '/admin' : '/p/campaigns';
  return <Navigate to={`${to}${location.search || ''}`} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConfigProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminGuard><Index /></AdminGuard>} />
              <Route path="/admin/partners" element={<Navigate to="/partners" replace />} />
              <Route path="/admin/campaigns" element={<Navigate to="/campaigns" replace />} />
              <Route path="/admin/publish" element={<Navigate to="/publish" replace />} />
              <Route path="/admin/segments" element={<Navigate to="/segments" replace />} />
              <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
              <Route path="/admin/qubetalk" element={<Navigate to="/qubetalk" replace />} />
              <Route path="/partners" element={<AdminGuard><Partners /></AdminGuard>} />
              <Route path="/partners/:id" element={<AdminGuard><PartnerDetail /></AdminGuard>} />
              <Route path="/campaigns" element={<AdminGuard><Campaigns /></AdminGuard>} />
              <Route path="/campaigns/:id" element={<AdminGuard><CampaignDetail /></AdminGuard>} />
              <Route path="/publish" element={<AdminGuard><Publish /></AdminGuard>} />
              <Route path="/segments" element={<AdminGuard><Segments /></AdminGuard>} />
              <Route path="/reports" element={<ReportsGuard><Reports /></ReportsGuard>} />
              <Route path="/qubetalk" element={<QubeTalk />} />

              {/* Partner Routes */}
              <Route path="/p/home" element={<PartnerGuard><PartnerHome /></PartnerGuard>} />
              <Route path="/p/packs" element={<PartnerGuard><PartnerPacksList /></PartnerGuard>} />
              <Route path="/p/packs/:id" element={<PartnerGuard><PartnerPackDetail /></PartnerGuard>} />
              <Route path="/p/campaigns" element={<PartnerGuard><PartnerCampaignCatalog /></PartnerGuard>} />
              <Route path="/p/campaigns/new" element={<PartnerGuard><PartnerProposeCampaign /></PartnerGuard>} />
              <Route path="/p/campaigns/:id" element={<PartnerGuard><PartnerCampaignDetail /></PartnerGuard>} />
              <Route path="/p/reports" element={<PartnerGuard><PartnerReports /></PartnerGuard>} />
              <Route path="/p/settings" element={<PartnerGuard><PartnerSettings /></PartnerGuard>} />
              <Route path="/p/qubetalk" element={<PartnerGuard><PartnerQubeTalk /></PartnerGuard>} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </ConfigProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
