import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3Icon,
  HomeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" />;
  }

  const navItems = [
    {
      title: "לוח בקרה",
      href: "/admin/dashboard",
      icon: <HomeIcon className="h-5 w-5 ml-2" />,
      description: "סקירה כללית של המערכת"
    },
    {
      title: "מוצרים",
      href: "/admin/products",
      icon: <PackageIcon className="h-5 w-5 ml-2" />,
      description: "ניהול מוצרים וקטגוריות"
    },
    {
      title: "הזמנות",
      href: "/admin/orders",
      icon: <ShoppingCartIcon className="h-5 w-5 ml-2" />,
      description: "ניהול וצפייה בהזמנות"
    },
    {
      title: "לקוחות",
      href: "/admin/custom-users",
      icon: <UsersIcon className="h-5 w-5 ml-2" />,
      description: "ניהול משתמשים והרשאות"
    },
    {
      title: "משתמשים",
      href: "/admin/users",
      icon: <UsersIcon className="h-5 w-5 ml-2" />,
      description: "ניהול משתמשי המערכת"
    },
    {
      title: "דוחות",
      href: "/admin/reports",
      icon: <BarChart3Icon className="h-5 w-5 ml-2" />,
      description: "דוחות ונתונים סטטיסטיים"
    },
    {
      title: "הגדרות",
      href: "/admin/settings",
      icon: <SettingsIcon className="h-5 w-5 ml-2" />,
      description: "הגדרות מערכת"
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-l hidden md:block">
        <div className="p-6">
          <Link to="/admin/dashboard" className="flex items-center justify-center gap-2">
            <img src="/assets/logo.png" alt="מאפיית אורבר" className="h-14 w-auto" />
          </Link>
        </div>

        <nav className="mt-6 px-4">
          <div className="space-y-3">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href} className="block">
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className="w-full justify-start relative group hover:py-3 transition-all"
                >
                  {item.icon}
                  <span>{item.title}</span>
                  
                  {/* Tooltip */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.description}
                  </div>
                </Button>
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOutIcon className="h-5 w-5 mr-2" />
              התנתקות
            </Button>
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background border-b z-50">
        <div className="p-4 flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] p-0">
              <div className="p-6 flex flex-col items-center">
                <img src="/assets/logo.png" alt="מאפיית אורבר" className="h-12 w-auto mb-2" />
                <SheetTitle>לוח בקרה</SheetTitle>
              </div>
              <nav className="px-2">
                {navItems.map((item) => (
                  <Link key={item.href} to={item.href} className="block mb-3">
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start hover:py-3 transition-all"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Button>
                  </Link>
                ))}
                <div className="mt-6 pt-6 border-t px-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <LogOutIcon className="h-5 w-5 mr-2" />
                    התנתקות
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="מאפיית אורבר" className="h-10 w-auto" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 md:p-8 overflow-y-auto mt-[73px] md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
