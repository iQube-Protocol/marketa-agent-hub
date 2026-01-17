import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "@/contexts/ConfigContext";
import { AdminGuard, PartnerGuard, ReportsGuard } from "@/components/auth/RouteGuard";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ConfigProvider>
          <Routes>
            {/* Admin Routes */}
            <Route path="/" element={<AdminGuard><Index /></AdminGuard>} />
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

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ConfigProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
