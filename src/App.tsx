import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReactNode, useEffect } from "react";
import { CartProvider } from "@/context/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";


// App version
export const APP_VERSION = "1.0.0"; // מינרל גז - אביגל טורג'מן

// Pages
import PhoneLogin from "@/pages/PhoneLogin";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import NotFound from "@/pages/NotFound";
import UserDashboard from "@/pages/UserDashboard";
import NewOrder from "@/pages/NewOrder";
import CurrentOrders from "@/pages/orders/CurrentOrders";
import OrderHistory from "@/pages/orders/OrderHistory";
import OrderSummaryPage from "@/pages/orders/OrderSummaryPage";
import EditOrder from "@/pages/orders/EditOrder";
import Reports from "@/pages/Reports";
import Calendar from "@/pages/Calendar";
import Home from "@/pages/Home";

// Admin Components & Pages
import AdminLogin from "@/pages/Admin/AdminLogin";
import AdminLayout from "@/pages/Admin/AdminLayout";
import Dashboard from "@/pages/Admin/Dashboard";
import Products from "@/pages/Admin/Products";
import ProductsManagement from "@/pages/Admin/ProductsManagement";
import Orders from "@/pages/Admin/Orders";
import Customers from "@/pages/Admin/Customers";
import AdminSettings from "@/pages/Admin/Settings";
import AdminReports from "@/pages/Admin/Reports";
import AdminOrders from "@/pages/Admin/Orders";
import OrdersManagement from "@/pages/Admin/OrdersManagement";
import ServiceRequests from "@/pages/Admin/ServiceRequests";
import UserSettings from "@/pages/UserSettings";
import Settings from "@/pages/Settings";
import EditProfile from "@/pages/EditProfile";
import ServiceRequest from "@/pages/ServiceRequest";
import RouteOptimization from "@/pages/Admin/RouteOptimization";
import DeliveryDays from "@/pages/Admin/DeliveryDays";
import PriceLists from "@/pages/Admin/PriceLists";
import AdminNewOrder from "@/pages/Admin/AdminNewOrder";
import AdminOrderSummaryPage from "@/pages/Admin/AdminOrderSummaryPage";
import Payment from "@/pages/Payment";
import AdminPayment from "@/pages/Admin/AdminPayment";


// HomePage component - now shows login page directly
function HomePage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <PhoneLogin />;
}

const queryClient = new QueryClient();

// AppContent component to use hooks inside providers
function AppContent() {
  // Initialize system settings (includes token validation)
  // useSystemSettings();

  return (
    <>
      <Toaster />
      <Router>
        <Routes>
          {/* Home page - shows login directly */}
          <Route path="/" element={<HomePage />} />

          {/* Public Routes */}
          <Route path="/login" element={<PhoneLogin />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/current" element={<CurrentOrders />} />
          <Route path="/orders/edit/:orderId" element={<EditOrder />} />
          <Route path="/orders/summary" element={<OrderSummaryPage />} />
          <Route path="/orders/payment" element={<Payment />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/service-request" element={<ServiceRequest />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <AdminLayout>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/manage" element={<ProductsManagement />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="orders/new" element={<AdminNewOrder />} />
                  <Route path="orders/summary" element={<AdminOrderSummaryPage />} />
                  <Route path="orders/payment" element={<AdminPayment />} />
                  <Route path="orders/manage" element={<OrdersManagement />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="price-lists" element={<PriceLists />} />
                  <Route path="service-requests" element={<ServiceRequests />} />
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="routes" element={<RouteOptimization />} />
                  <Route path="delivery-days" element={<DeliveryDays />} />
                </Routes>
              </AdminLayout>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

const App = () => {
  // Log app version on startup
  useEffect(() => {
    console.log(`מינרל גז - אביגל טורג'מן - גרסה ${APP_VERSION}`);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
