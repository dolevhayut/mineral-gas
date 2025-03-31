
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
import { CakeIcon, KeyIcon, IdCardIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [sapCustomerId, setSapCustomerId] = useState("");
  const [phonePassword, setPhonePassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleDebug = async () => {
    try {
      // Format phone number for consistency
      let formattedPhone = phonePassword;
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }
      formattedPhone = formattedPhone.replace(/\D/g, '');
      formattedPhone = '+' + formattedPhone;

      console.log("Checking users with phone:", formattedPhone);
      const { data, error } = await supabase.rpc('verify_user_password', {
        user_phone: formattedPhone,
        user_password: formattedPhone
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
          description: "לא נמצא משתמש עם מספר טלפון זה",
          variant: "destructive"
        });
      } else {
        const matchingUser = data.find(user => user.sap_customer_id === sapCustomerId);
        if (matchingUser) {
          toast({
            title: "פעולת בדיקה",
            description: `נמצא משתמש: ${matchingUser.name}, תפקיד: ${matchingUser.role}`,
          });
        } else {
          toast({
            title: "פעולת בדיקה",
            description: "לא נמצא משתמש עם מזהה לקוח זה",
            variant: "destructive"
          });
        }
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
    
    console.log("Attempting admin login with SAP ID:", sapCustomerId);
    
    try {
      const success = await login(sapCustomerId, phonePassword);
      console.log("Admin login result:", success, "User:", user);
      
      if (success) {
        if (user?.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          toast({
            title: "גישה נדחתה",
            description: "אין לך הרשאות מנהל",
            variant: "destructive"
          });
        }
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            התחברות למערכת ניהול
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  מספר הזיהוי של המנהל
                </div>
                <Label htmlFor="sapCustomerId" className="flex items-center gap-2">
                  <IdCardIcon className="h-4 w-4" />
                  <span>מזהה לקוח</span>
                </Label>
              </div>
              <Input
                id="sapCustomerId"
                placeholder="הזן מזהה לקוח"
                value={sapCustomerId}
                onChange={(e) => setSapCustomerId(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <a className="text-sm text-bakery-600 hover:underline">
                  שכחת סיסמה?
                </a>
                <Label htmlFor="phonePassword" className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  <span>סיסמה (מספר טלפון)</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="phonePassword"
                  type={showPassword ? "text" : "password"}
                  value={phonePassword}
                  onChange={(e) => setPhonePassword(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="הזן את מספר הטלפון שלך"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <div className="text-xs text-right text-muted-foreground">
                הסיסמה היא מספר הטלפון הנייד שלך
              </div>
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
                <span>חזור לאתר </span>
                <a
                  className="text-bakery-600 hover:underline"
                  onClick={() => navigate("/login")}
                  style={{ cursor: "pointer" }}
                >
                  כניסת לקוח
                </a>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AdminLogin;
