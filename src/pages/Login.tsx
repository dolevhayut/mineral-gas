
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to the appropriate dashboard
  if (isAuthenticated) {
    return user?.role === "admin" 
      ? <Navigate to="/admin/dashboard" /> 
      : <Navigate to="/dashboard" />;
  }

  const handleDebug = async () => {
    try {
      console.log("Checking users with phone:", phone);
      const { data, error } = await supabase.rpc('verify_user_password', {
        user_phone: phone,
        user_password: password
      });
      
      console.log("Debug response:", data);
      console.log("Debug error:", error);
      
      if (error) {
        toast({
          title: "פעולת בדיקה",
          description: `שגיאה: ${error.message}`,
          variant: "destructive"
        });
      } else if (data && data.length === 0) {
        toast({
          title: "פעולת בדיקה",
          description: "לא נמצא משתמש עם מספר טלפון וסיסמה אלו",
          variant: "destructive"
        });
      } else {
        toast({
          title: "פעולת בדיקה",
          description: `נמצא משתמש: ${data[0]?.name}`,
        });
      }
    } catch (err) {
      console.error("Debug error:", err);
      toast({
        title: "פעולת בדיקה",
        description: `שגיאה בבדיקה: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log("Attempting login with phone:", phone);
    
    try {
      const success = await login(phone, password);
      console.log("Login result:", success, "User:", user);
      
      if (success) {
        // Login redirects user to appropriate dashboard based on role
        navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        toast({
          title: "התחברות נכשלה",
          description: "שם משתמש או סיסמה לא נכונים",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "שגיאת התחברות",
        description: `אירעה שגיאה בהתחברות: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-numeric characters except plus sign
    const value = e.target.value;
    // Allow + only at the beginning
    if (value === "+" || (value.startsWith("+") && value.length > 1)) {
      setPhone(value.replace(/[^\d+]/g, ""));
    } else {
      setPhone(value.replace(/[^\d]/g, ""));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 auth-container">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <CakeIcon className="h-12 w-12 text-bakery-500" />
          </div>
          <CardTitle className="text-2xl">מאפיית אורבר</CardTitle>
          <CardDescription>
            הזן את מספר הטלפון והסיסמה שלך להתחברות
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={handlePhoneChange}
                required
                className="text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <a className="text-sm text-bakery-600 hover:underline">
                  שכחת את הסיסמה?
                </a>
                <Label htmlFor="password">סיסמה</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
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
            <div className="flex justify-between w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDebug}
                className="text-xs"
              >
                בדוק פרטי התחברות
              </Button>
              <div className="text-center text-sm text-gray-500">
                לשאלות בנוגע לחשבון, פנה למנהל המערכת
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
