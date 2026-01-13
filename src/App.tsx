import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScanPaint from "./pages/ScanPaint";
import GroupDetail from "./pages/GroupDetail";
import Groups from "./pages/Groups";
import Bills from "./pages/Bills";
import Settlement from "./pages/Settlement";
import BillDetail from "./pages/BillDetail";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/scan" element={<ScanPaint />} />
          <Route path="/group/:groupId" element={<GroupDetail />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/settle" element={<Settlement />} />
          <Route path="/bill/:billId" element={<BillDetail />} />
          <Route path="/account" element={<Account />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
