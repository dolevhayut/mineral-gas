import { useEffect, ReactNode, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings,
  LogOut,
  Fuel,
  Wrench,
  Menu,
  X,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // Check if admin is authenticated
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      navigate("/admin");
    }
  }, [navigate]);

  // Handle ESC key to close sidebar
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isSidebarOpen]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    sessionStorage.removeItem("adminLoginTime");
    navigate("/admin");
  };

  const menuItems = [
    { path: "/admin/dashboard", label: "דשבורד", icon: LayoutDashboard },
    { path: "/admin/products", label: "מוצרים", icon: Fuel },
    { path: "/admin/orders", label: "הזמנות", icon: ShoppingCart },
    { path: "/admin/customers", label: "לקוחות", icon: Users },
    { path: "/admin/routes", label: "ניהול מסלולים", icon: Route },
    { path: "/admin/service-requests", label: "קריאות שירות", icon: Wrench },
    { path: "/admin/reports", label: "דוחות", icon: FileText },
    { path: "/admin/settings", label: "הגדרות", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white shadow-md z-40 flex items-center justify-between px-4">
        {/* Toggle Button - בצד שמאל */}
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-bottle-600 hover:bg-bottle-700 transition-all duration-300"
          size="icon"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Logo - בצד ימין */}
        <div className="flex items-center gap-2">
          <img src="/assets/logo.png" alt="מינרל גז" className="h-10 w-auto" />
        </div>
      </header>

      {/* Overlay - מופיע כשהסיידבר פתוח */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - מעל הכל עם אנימציה חלקה */}
      <aside 
        className={cn(
          "fixed inset-y-0 right-0 w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-center h-16 border-b bg-white px-4">
          <div className="flex items-center gap-2">
            <Fuel className="h-6 w-6 text-bottle-600" />
            <span className="text-lg font-bold text-gray-900">מינרל גז - ניהול</span>
          </div>
        </div>
        
        <nav className="p-4 space-y-2 h-[calc(100vh-8rem)] overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  // סגור את הסיידבר במובייל אחרי לחיצה
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-bottle-600 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100 hover:translate-x-[-4px]"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50 transition-colors"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            יציאה
          </Button>
        </div>
      </aside>

      {/* Main Content - התוכן ממלא את כל המסך */}
      <div className="w-full pt-16">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
