import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import Offers from "./pages/Offers";
import CustomTour from "./pages/CustomTour";
import Dashboard from "./pages/Dashboard";
import BookingConfirmation from "./pages/BookingConfirmation";
import PaymentPage from "./pages/PaymentPage"; // <--- 1. IMPORT ADDED HERE
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/custom" element={<CustomTour />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* 2. ROUTE ADDED HERE */}
          <Route path="/payment" element={<PaymentPage />} />

          <Route
            path="/booking-confirmation"
            element={<BookingConfirmation />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
