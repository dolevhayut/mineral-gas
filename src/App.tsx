import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Pages
import Login from "@/pages/Login";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import NotFound from "@/pages/NotFound";

// Admin Components & Pages
import AdminLayout from "@/components/AdminLayout";
import Dashboard from "@/pages/Admin/Dashboard";
import Products from "@/pages/Admin/Products";
import Orders from "@/pages/Admin/Orders";
import CustomUsers from "@/pages/Admin/CustomUsers";
import Settings from "@/pages/Admin/Settings";
import Users from "@/pages/Admin/Users";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <Router>
            <Routes>
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <RequireAuth>
                    <AdminLayout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/orders" element={<Orders />} />
                        <Route path="/custom-users" element={<CustomUsers />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="users" element={<Users />} />
                      </Routes>
                    </AdminLayout>
                  </RequireAuth>
                }
              />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
