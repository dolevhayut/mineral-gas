
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
              <SheetContent side="left" className="w-[250px]">
                <SheetHeader className="mb-4">
                  <SheetTitle>Sweet Savor Bakery</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2">
                  <Link
                    to="/"
                    className="px-4 py-2 rounded-md hover:bg-accent"
                  >
                    Home
                  </Link>
                  <Link
                    to="/catalog"
                    className="px-4 py-2 rounded-md hover:bg-accent"
                  >
                    Catalog
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 rounded-md hover:bg-accent"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/orders"
                        className="px-4 py-2 rounded-md hover:bg-accent"
                      >
                        My Orders
                      </Link>
                      <Button
                        variant="ghost"
                        className="justify-start px-4 py-2 h-auto font-normal"
                        onClick={() => logout()}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 h-auto font-normal"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center">
            <CakeIcon className="h-6 w-6 mr-2 text-bakery-600" />
            <span className="text-xl font-serif font-bold tracking-tight">
              Sweet Savor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            to="/catalog"
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-bakery-100 to-bakery-200 p-6 no-underline outline-none focus:shadow-md"
                          >
                            <CakeIcon className="h-6 w-6 text-bakery-600" />
                            <div className="mb-2 mt-4 text-lg font-medium">
                              Catalog
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Browse our delicious selection of freshly baked
                              goods
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <Link
                          to="/catalog?category=Bread"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Bread
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Artisanal breads baked fresh daily
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/catalog?category=Cakes"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Cakes
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Celebration cakes for every occasion
                          </p>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/catalog?category=Pastries"
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            Pastries
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Delicate pastries made with butter and love
                          </p>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/about">
                    <NavigationMenuLink
                      className={navigationMenuTriggerStyle()}
                    >
                      About
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
                        Admin
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side - User & Cart */}
          <div className="flex items-center space-x-4">
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCartIcon />
                {totalItems > 0 && (
                  <Badge
                    className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-bakery-500"
                    variant="secondary"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

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
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.name || "My Account"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/orders")}
                  >
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => logout()}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                className="bg-bakery-600 hover:bg-bakery-700"
                onClick={() => navigate("/login")}
              >
                Log In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-cream-100 border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-serif text-xl mb-4">Sweet Savor Bakery</h3>
              <p className="text-muted-foreground">
                Artisanal bakery offering fresh bread, pastries, and cakes made
                from scratch daily.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="hover:text-bakery-600">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/catalog" className="hover:text-bakery-600">
                    Catalog
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="hover:text-bakery-600">
                    About Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Contact</h4>
              <address className="not-italic text-muted-foreground">
                <p>123 Baker Street</p>
                <p>Caketown, CT 12345</p>
                <p className="mt-2">Phone: (123) 456-7890</p>
                <p>Email: info@sweetsavor.com</p>
              </address>
            </div>
            <div>
              <h4 className="font-medium mb-4">Hours</h4>
              <p className="text-muted-foreground">
                <span className="font-medium">Mon-Fri:</span> 7am - 7pm
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Sat:</span> 8am - 6pm
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Sun:</span> 8am - 3pm
              </p>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Sweet Savor Bakery. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
