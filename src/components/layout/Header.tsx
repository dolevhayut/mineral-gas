
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import MobileMenu from "./MobileMenu";
import DesktopNav from "./DesktopNav";
import UserMenu from "./UserMenu";

export default function Header() {
  const { isAuthenticated, user, logout } = useAuth();

  // Determine dashboard link based on user role
  const dashboardLink = user?.role === "admin" ? "/admin/dashboard" : "/dashboard";

  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <MobileMenu 
            isAuthenticated={isAuthenticated}
            user={user}
            logout={logout}
            dashboardLink={dashboardLink}
          />
        </div>

        {/* Logo */}
        <Link to={isAuthenticated ? dashboardLink : "/"} className="flex items-center">
          <span className="text-xl font-serif font-bold tracking-tight">
            אורבר
          </span>
        </Link>

        {/* Desktop Navigation */}
        <DesktopNav userRole={user?.role} />

        {/* Right Side - User & Cart */}
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <UserMenu 
            user={user}
            logout={logout}
            isAuthenticated={isAuthenticated}
            dashboardLink={dashboardLink}
          />
        </div>
      </div>
    </header>
  );
}
