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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const [sapCustomerId, setSapCustomerId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to the appropriate dashboard
  if (isAuthenticated) {
    return user?.role === "admin" 
      ? <Navigate to="/admin/dashboard" /> 
      : <Navigate to="/dashboard" />;
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digit characters except +
    let value = e.target.value.replace(/[^\d+]/g, '');
    
    // Ensure only one + at the start and it's the first character
    if (!value.startsWith('+')) {
      value = '+' + value.replace(/\+/g, '');
    } else {
      value = '+' + value.slice(1).replace(/\+/g, '');
    }
    
    // Remove any spaces or invisible characters
    value = value.trim();
    
    console.log("Setting phone value:", value);
    setPassword(value);
  };

  const handleDebug = async () => {
    setErrorMessage(null);
    try {
      console.log("Debug - Checking user with SAP ID:", sapCustomerId, "and phone:", password);
      
      // Query custom_users table directly
      const { data, error } = await supabase
        .from('custom_users')
        .select('*')
        .eq('sap_customer_id', sapCustomerId)
        .eq('phone', password);
      
      console.log("Debug response:", data);
      console.log("Debug error:", error);
      
      if (error) {
        setErrorMessage(`שגיאת שרת: ${error.message}`);
        toast({
          title: "פעולת בדיקה",
          description: `שגיאה: ${error.message}`,
          variant: "destructive"
        });
      } else if (!data || data.length === 0) {
        setErrorMessage("לא נמצא משתמש עם הפרטים שהוזנו");
        toast({
          title: "פעולת בדיקה",
          description: "לא נמצא משתמש עם הפרטים שהוזנו",
          variant: "destructive"
        });
      } else {
        const user = data[0];
        setErrorMessage(null);
        toast({
          title: "פעולת בדיקה",
          description: `נמצא משתמש: ${user.name}, תפקיד: ${user.role}`,
        });
      }
    } catch (err) {
      console.error("Debug error:", err);
      setErrorMessage(`שגיאה בבדיקה: ${err instanceof Error ? err.message : String(err)}`);
      toast({
        title: "פעולת בדיקה",
        description: `שגיאה בבדיקה: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up the phone number before submitting
    const cleanPhone = password.trim();
    
    // Validate phone number format before submitting
    if (!cleanPhone.match(/^\+\d{6,}$/)) {
      setErrorMessage("מספר טלפון חייב להתחיל עם + ולהכיל לפחות 6 ספרות");
      toast({
        title: "שגיאת קלט",
        description: "מספר טלפון חייב להתחיל עם + ולהכיל לפחות 6 ספרות",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    console.log("Submitting with phone:", cleanPhone);
    
    try {
      const success = await login(sapCustomerId, cleanPhone);
      console.log("Login result:", success, "User:", user);
      
      if (success) {
        // Login redirects user to appropriate dashboard based on role
        navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        setErrorMessage("מזהה לקוח או סיסמה לא נכונים");
        toast({
          title: "התחברות נכשלה",
          description: "מזהה לקוח או סיסמה לא נכונים",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(`אירעה שגיאה בהתחברות: ${error instanceof Error ? error.message : String(error)}`);
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
    <div className="min-h-screen flex items-center justify-center px-4 auth-container">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <CakeIcon className="h-12 w-12 text-bakery-500" />
          </div>
          <CardTitle className="text-2xl">מאפיית אורבר</CardTitle>
          <CardDescription>
            התחברות למערכת ההזמנות
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>התחברות נכשלה</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  מספר הזיהוי שקיבלת מהמאפייה
                </div>
                <Label htmlFor="sapCustomerId" className="flex items-center gap-2">
                  <IdCardIcon className="h-4 w-4" />
                  <span>מזהה לקוח</span>
                </Label>
              </div>
              <Input
                id="sapCustomerId"
                placeholder="הזן את מזהה הלקוח שלך"
                value={sapCustomerId}
                onChange={(e) => setSapCustomerId(e.target.value)}
                required
                className="text-right"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <a className="text-sm text-bakery-600 hover:underline">
                  שכחת את מספר הטלפון?
                </a>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4" />
                  <span>מספר טלפון</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePhoneChange}
                  required
                  className="text-right pr-10"
                  dir="ltr"
                  placeholder="הזן את מספר הטלפון שלך"
                  inputMode="tel"
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
                פנה למנהל המערכת אם שכחת את מספר הטלפון שלך
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
