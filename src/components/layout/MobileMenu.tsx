
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
}

export default function MobileMenu({ isAuthenticated, user, logout }: MobileMenuProps) {
  const navigate = useNavigate();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[250px]">
        <SheetHeader className="mb-4">
          <SheetTitle>מאפיית אורבר</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-2">
          <Link
            to="/dashboard"
            className="px-4 py-2 rounded-md hover:bg-accent text-right"
          >
            לוח בקרה
          </Link>
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
            to="/settings"
            className="px-4 py-2 rounded-md hover:bg-accent text-right"
          >
            הגדרות
          </Link>
          <Link
            to="/reports"
            className="px-4 py-2 rounded-md hover:bg-accent text-right"
          >
            דוחות
          </Link>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="px-4 py-2 rounded-md hover:bg-accent text-right"
            >
              ניהול
            </Link>
          )}
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
