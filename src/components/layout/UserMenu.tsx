
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types";

interface UserMenuProps {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
}

export default function UserMenu({ user, logout, isAuthenticated }: UserMenuProps) {
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <Button
        variant="default"
        className="bg-bakery-600 hover:bg-bakery-700"
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
  );
}
