
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

// Page imports
import Home from "./pages/Home";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/Admin/Dashboard";
import NewOrder from "./pages/NewOrder";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import CurrentOrders from "./pages/orders/CurrentOrders";
import TomorrowOrder from "./pages/orders/TomorrowOrder";
import OrderHistory from "./pages/orders/OrderHistory";

// Admin page imports
import ProductsManagement from "./pages/Admin/ProductsManagement";
import UsersManagement from "./pages/Admin/UsersManagement";
import CustomUsersManagement from "./pages/Admin/CustomUsersManagement";
import OrdersManagement from "./pages/Admin/OrdersManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" />} />
              
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              
              {/* Customer Routes */}
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/orders/new" element={<NewOrder />} />
              <Route path="/orders" element={<OrderHistory />} />
              <Route path="/orders/current" element={<CurrentOrders />} />
              <Route path="/orders/tomorrow" element={<TomorrowOrder />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<NotFound />} />
              
              {/* Admin Routes - Using the same layout structure */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/products" element={<ProductsManagement />} />
              <Route path="/admin/custom-users" element={<CustomUsersManagement />} />
              <Route path="/admin/orders" element={<OrdersManagement />} />
              
              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
