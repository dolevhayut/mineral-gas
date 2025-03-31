
import { useAuth } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CakeIcon, MenuIcon, ShoppingCartIcon, UserIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Mobile Menu */}
          <div className="lg:hidden">
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
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <CakeIcon className="h-6 w-6 ml-2 text-bakery-600" />
            <span className="text-xl font-serif font-bold tracking-tight">
              אורבר
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/dashboard">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      לוח בקרה
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>הזמנות</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      <li>
                        <Link
                          to="/orders/new"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            הזמנה חדשה
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            יצירת הזמנה חדשה
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/orders"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            היסטוריה
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            צפייה בהיסטוריית ההזמנות שלך
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/reports">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      דוחות
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/settings">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      הגדרות
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                {user?.role === "admin" && (
                  <NavigationMenuItem>
                    <Link to="/admin">
                      <NavigationMenuLink
                        className={cn(
                          navigationMenuTriggerStyle(),
                          "text-bakery-600"
                        )}
                      >
                        ניהול
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side - User & Cart */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-8 w-8"
                  >
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-bakery-100 text-bakery-800">
                        {user?.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : ""}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.name || "החשבון שלי"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                  >
                    הגדרות
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/orders")}
                  >
                    היסטוריה
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                  >
                    התנתקות
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                className="bg-bakery-600 hover:bg-bakery-700"
                onClick={() => navigate("/login")}
              >
                התחברות
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>
    </div>
  );
}
