import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types";
import { UserIcon } from "lucide-react";

interface UserMenuProps {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  dashboardLink: string;
}

export default function UserMenu({ user, logout, isAuthenticated, dashboardLink }: UserMenuProps) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  if (!isAuthenticated) {
    return (
      <Button
        variant="default"
        className="bg-bottle-600 hover:bg-bottle-700"
        onClick={() => navigate("/login")}
      >
        התחברות
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8"
        >
          <Avatar className="h-8 w-8 border">
            <AvatarImage src="/assets/profile-placeholder.png" alt="Profile" />
            <AvatarFallback className="bg-bottle-100 text-bottle-800">
              <UserIcon className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="text-right">
        <DropdownMenuLabel>
          {user?.name || "החשבון שלי"}
          {isAdmin && <span className="block text-xs text-muted-foreground">מנהל מערכת</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => navigate(dashboardLink)}
          className="justify-end"
        >
          עמוד הבית
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => navigate("/user/settings")}
          className="justify-end"
        >
          הגדרות
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => navigate("/edit-profile")}
          className="justify-end"
        >
          עריכת פרופיל
        </DropdownMenuItem>
        
        {!isAdmin && (
          <DropdownMenuItem
            onClick={() => navigate("/orders")}
            className="justify-end"
          >
            היסטוריה
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout()}
          className="justify-end"
        >
          התנתקות
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
