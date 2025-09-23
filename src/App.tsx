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
import EditProfile from "@/pages/EditProfile";
import ServiceRequest from "@/pages/ServiceRequest";

// RequireAuth component
function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.role || user.role !== "admin") {
    return <Navigate to="/catalog" replace />;
  }

  return <>{children}</>;
}

// HomePage component - now shows login page directly
function HomePage() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/catalog" replace /> : <PhoneLogin />;
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
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/service-request" element={<ServiceRequest />} />

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
