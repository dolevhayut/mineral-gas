import React from "react";
import { Link, useNavigate } from "react-router-dom";
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

// Custom NavigationMenuLink that works with React Router
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { href: string }
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          to={href}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

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
                <NavigationMenuLink asChild>
                  <Link
                    to="/admin/dashboard"
                    className={navigationMenuTriggerStyle()}
                  >
                    עמוד הבית
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>ניהול</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <ListItem href="/admin/products" title="מוצרים">
                      ניהול מוצרים וקטגוריות
                    </ListItem>
                    <ListItem href="/admin/orders" title="הזמנות">
                      ניהול הזמנות ומעקב
                    </ListItem>
                    <ListItem href="/admin/custom-users" title="משתמשים">
                      ניהול משתמשים והרשאות
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/user/settings"
                    className={navigationMenuTriggerStyle()}
                  >
                    הגדרות
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </>
          ) : (
            <>
              {/* Regular User Navigation */}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/dashboard"
                    className={navigationMenuTriggerStyle()}
                  >
                    עמוד הבית
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>הזמנות</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                    <ListItem href="/orders/new" title="הזמנה חדשה">
                      יצירת הזמנה חדשה
                    </ListItem>
                    <ListItem href="/orders" title="היסטוריה">
                      צפייה בהיסטוריית ההזמנות שלך
                    </ListItem>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/reports"
                    className={navigationMenuTriggerStyle()}
                  >
                    דוחות
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/user/settings"
                    className={navigationMenuTriggerStyle()}
                  >
                    הגדרות
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
