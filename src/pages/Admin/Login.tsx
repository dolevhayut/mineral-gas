
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { CakeIcon } from "lucide-react";

const AdminLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, redirect to admin dashboard
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" />;
  }
  
  // If authenticated but not as admin, redirect to user dashboard
  if (isAuthenticated && user?.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await login(phone, password);
    setIsLoading(false);
    if (success) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 auth-container" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <CakeIcon className="h-12 w-12 text-bakery-500" />
          </div>
          <CardTitle className="text-3xl">כניסת מנהל</CardTitle>
          <CardDescription>
            יש להזין מספר טלפון וסיסמה
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">סיסמה</Label>
                <a className="text-sm text-bakery-600 hover:underline">
                  שכחת סיסמה?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-bakery-600 hover:bg-bakery-700"
              disabled={isLoading}
            >
              {isLoading ? "מתחבר..." : "התחברות"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              <span>חזור לאתר </span>
              <a
                className="text-bakery-600 hover:underline"
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                כניסת לקוח
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
