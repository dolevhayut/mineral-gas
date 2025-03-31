
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { UserIcon, ShoppingBagIcon, BarChart3Icon, SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "הפרופיל שלי",
    icon: <UserIcon className="h-6 w-6" />,
    path: "/profile",
  },
  {
    title: "ההזמנות שלי",
    icon: <ShoppingBagIcon className="h-6 w-6" />,
    path: "/orders",
  },
  {
    title: "דוחות",
    icon: <BarChart3Icon className="h-6 w-6" />,
    path: "/reports",
  },
  {
    title: "הגדרות",
    icon: <SettingsIcon className="h-6 w-6" />,
    path: "/settings",
  },
];

const StickyFooter: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-16">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              location.pathname === item.path
                ? "text-bakery-600"
                : "text-gray-500 hover:text-bakery-600"
            )}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default StickyFooter;
