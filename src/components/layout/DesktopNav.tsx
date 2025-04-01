import { Link } from "react-router-dom";
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

interface DesktopNavProps {
  userRole?: string;
}

export default function DesktopNav({ userRole }: DesktopNavProps) {
  const isAdmin = userRole === "admin";
  
  return (
    <div className="hidden lg:block">
      <NavigationMenu>
        <NavigationMenuList>
          {/* Admin Navigation */}
          {isAdmin ? (
            <>
              <NavigationMenuItem>
                <Link to="/admin/dashboard">
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                  >
                    לוח בקרה
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>ניהול</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <li>
                      <Link
                        to="/admin/products"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          מוצרים
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          ניהול מוצרים וקטגוריות
                        </p>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/orders"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          הזמנות
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          ניהול הזמנות ומעקב
                        </p>
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/admin/custom-users"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">
                          משתמשים
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          ניהול משתמשים והרשאות
                        </p>
                      </Link>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/user/settings">
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                  >
                    הגדרות
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </>
          ) : (
            <>
              {/* Regular User Navigation */}
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
                <Link to="/user/settings">
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                  >
                    הגדרות
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
