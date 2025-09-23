import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReactNode, useEffect } from "react";
import { CartProvider } from "@/context/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSystemSettings } from "@/hooks/useSystemSettings";

// App version
export const APP_VERSION = "1.0.3"; // מאפיית אורבר

// Pages
import Login from "@/pages/Login";
import Catalog from "@/pages/Catalog";
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
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Admin/Dashboard";
import Products from "@/pages/Admin/Products";
import ProductsManagement from "@/pages/Admin/ProductsManagement";
import Orders from "@/pages/Admin/Orders";
import CustomUsers from "@/pages/Admin/CustomUsers";
import CustomUsersManagement from "@/pages/Admin/CustomUsersManagement";
import Customers from "@/pages/Admin/Customers";
import AdminSettings from "@/pages/Admin/Settings";
import Users from "@/pages/Admin/Users";
import UsersManagement from "@/pages/Admin/UsersManagement";
import AdminReports from "@/pages/Admin/Reports";
import AdminOrders from "@/pages/Admin/Orders";
import OrdersManagement from "@/pages/Admin/OrdersManagement";
import UserSettings from "@/pages/UserSettings";
import Settings from "@/pages/Settings";

// RequireAuth component
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.role || user.role !== "admin") {
    return <Navigate to="/catalog" replace />;
  }

  return <>{children}</>;
}

// HomePage component to redirect based on auth state
function HomePage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

// AppContent component to use hooks inside providers
function AppContent() {
  // Initialize system settings (includes token validation)
  useSystemSettings();

  return (
    <>
      <Toaster />
      <Router>
        <Routes>
          {/* Redirect root based on authentication state */}
          <Route path="/" element={<HomePage />} />

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/current" element={<CurrentOrders />} />
          <Route path="/orders/edit/:orderId" element={<EditOrder />} />
          <Route path="/orders/summary" element={<OrderSummaryPage />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/user/settings" element={<UserSettings />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <RequireAuth>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="products/manage" element={<ProductsManagement />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="orders/manage" element={<OrdersManagement />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="users" element={<Users />} />
                    <Route path="users/manage" element={<UsersManagement />} />
                    <Route path="custom-users" element={<CustomUsers />} />
                    <Route path="custom-users/manage" element={<CustomUsersManagement />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="reports" element={<AdminReports />} />
                  </Routes>
                </AdminLayout>
              </RequireAuth>
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
    console.log(`מאפיית אורבר - גרסה ${APP_VERSION}`);
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
