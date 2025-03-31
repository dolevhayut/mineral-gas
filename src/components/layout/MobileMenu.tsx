import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { MenuIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

interface MobileMenuProps {
  isAuthenticated: boolean;
  user: any;
  logout: () => void;
  dashboardLink: string;
}

export default function MobileMenu({ isAuthenticated, user, logout, dashboardLink }: MobileMenuProps) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px]">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-center flex-col">
            <img src="/assets/logo.png" alt="מאפיית אורבר" className="h-10 w-auto mb-2" />
            <SheetTitle>מאפיית אורבר</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          <Link
            to={dashboardLink}
            className="px-4 py-2 rounded-md hover:bg-accent text-right"
          >
            לוח בקרה
          </Link>

          {isAdmin ? (
            <>
              <Link
                to="/admin/products"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                ניהול מוצרים
              </Link>
              <Link
                to="/admin/orders"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                ניהול הזמנות
              </Link>
              <Link
                to="/admin/custom-users"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                ניהול משתמשים
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/orders/new"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                הזמנה חדשה
              </Link>
              <Link
                to="/orders"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                היסטוריה
              </Link>
              <Link
                to="/reports"
                className="px-4 py-2 rounded-md hover:bg-accent text-right"
              >
                דוחות
              </Link>
            </>
          )}

          <Link
            to="/settings"
            className="px-4 py-2 rounded-md hover:bg-accent text-right"
          >
            הגדרות
          </Link>
          
          {isAuthenticated ? (
            <Button
              variant="ghost"
              className="justify-end px-4 py-2 h-auto font-normal"
              onClick={() => logout()}
            >
              התנתקות
            </Button>
          ) : (
            <Button
              variant="ghost"
              className="justify-end px-4 py-2 h-auto font-normal"
              onClick={() => navigate("/login")}
            >
              התחברות
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
