
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BarChart3Icon,
  CakeIcon,
  HomeIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" />;
  }

  const navItems = [
    {
      title: "לוח בקרה",
      href: "/admin",
      icon: <HomeIcon className="h-5 w-5 ml-2" />,
    },
    {
      title: "מוצרים",
      href: "/admin/products",
      icon: <CakeIcon className="h-5 w-5 ml-2" />,
    },
    {
      title: "הזמנות",
      href: "/admin/orders",
      icon: <ShoppingCartIcon className="h-5 w-5 ml-2" />,
    },
    {
      title: "משתמשים",
      href: "/admin/users",
      icon: <UsersIcon className="h-5 w-5 ml-2" />,
    },
    {
      title: "נתונים",
      href: "/admin/analytics",
      icon: <BarChart3Icon className="h-5 w-5 ml-2" />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-l hidden md:block">
        <div className="p-6">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-serif font-bold">סוויט סייבור</h1>
            <CakeIcon className="h-6 w-6 mr-2 text-bakery-600" />
          </Link>
          <div className="mt-2 text-sm text-muted-foreground text-right">פאנל ניהול</div>
        </div>

        <nav className="mt-6 px-4 pb-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link to={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-end",
                      isActive(item.href) &&
                        "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    {item.title}
                    {item.icon}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-12">
            <Link to="/catalog">
              <Button
                variant="outline"
                className="w-full justify-end"
              >
                צפייה בחנות
                <PackageIcon className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="md:hidden bg-sidebar p-4 border-b">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">ניהול</div>
            <Link to="/" className="flex items-center">
              <h1 className="text-lg font-serif font-bold">סוויט סייבור</h1>
              <CakeIcon className="h-6 w-6 mr-2 text-bakery-600" />
            </Link>
          </div>

          {/* Mobile Navigation */}
          <div className="mt-4 flex overflow-x-auto pb-2 gap-2">
            {navItems.map((item) => (
              <Link key={item.href} to={item.href}>
                <Button
                  size="sm"
                  variant={isActive(item.href) ? "default" : "outline"}
                  className="whitespace-nowrap"
                >
                  {item.icon}
                  <span className="hidden sm:inline mr-2">{item.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
