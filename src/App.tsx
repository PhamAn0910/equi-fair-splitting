import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSyncManager } from "@/hooks/useSyncManager";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ScanPaint from "./pages/ScanPaint";
import GroupDetail from "./pages/GroupDetail";
import Groups from "./pages/Groups";
import Bills from "./pages/Bills";
import Settlement from "./pages/Settlement";
import BillDetail from "./pages/BillDetail";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useSyncManager();

  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/scan" element={<ScanPaint />} />
          
          {/* Protected Routes - Require Authentication */}
          <Route element={<ProtectedRoute />}>
            <Route path="/group/:groupId" element={<GroupDetail />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/settle" element={<Settlement />} />
            <Route path="/bill/:billId" element={<BillDetail />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
