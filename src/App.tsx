import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import PartnerForm from "./pages/PartnerForm";
import OrderForm from "./pages/OrderForm";
import QuestionForm from "./pages/QuestionForm";
import MyCard from "./pages/MyCard";
import NotFound from "./pages/NotFound";
import AdminAuth from "./pages/admin/AdminAuth";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/partner-form" element={<PartnerForm />} />
            <Route path="/order-form" element={<OrderForm />} />
            <Route path="/question-form" element={<QuestionForm />} />
            <Route path="/my-card" element={<MyCard />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminAuth />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="partners" element={<AdminPartners />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="questions" element={<AdminQuestions />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
