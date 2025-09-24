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
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyIcon, IdCardIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import SEOHead from "@/components/SEOHead";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and format as Israeli phone number
    let value = e.target.value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setPhone(value);
  };

  // Send verification code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number format
    if (!phone.match(/^0[0-9]{9}$/)) {
      setErrorMessage("מספר טלפון חייב להיות בפורמט ישראלי (10 ספרות)");
      toast({
        title: "שגיאת קלט",
        description: "מספר טלפון חייב להיות בפורמט ישראלי (10 ספרות)",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.rpc('send_verification_code', {
        p_phone: phone
      });
      
      if (error) throw error;
      
      setShowCodeInput(true);
      toast({
        title: "קוד נשלח בהצלחה",
        description: `קוד אימות נשלח למספר ${phone}`,
      });
      
      // In development, show the code (remove in production)
      if (data) {
        console.log("Verification code:", data);
        toast({
          title: "קוד אימות (למטרות פיתוח)",
          description: `הקוד שלך: ${data}`,
        });
      }
    } catch (error) {
      console.error("Send code error:", error);
      setErrorMessage(`אירעה שגיאה: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code and login
  const handleVerifyCode = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { data, error } = await supabase.rpc('verify_phone_number', {
        p_phone: phone,
        p_code: verificationCode
      });
      
      if (error) throw error;
      
      if (data?.success) {
        // Login successful
        const customer = data.customer;
        
        // Store customer data in local storage
        localStorage.setItem('mineral_gas_customer', JSON.stringify(customer));
        
        // Navigate based on role
        navigate(customer.role === 'admin' ? '/admin/dashboard' : '/catalog');
        
        toast({
          title: "התחברות הצליחה",
          description: `ברוך הבא ${customer.name || 'לקוח יקר'}!`,
        });
      } else {
        setErrorMessage(data?.message || "קוד אימות שגוי");
        toast({
          title: "שגיאה",
          description: data?.message || "קוד אימות שגוי",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Verify code error:", error);
      setErrorMessage(`אירעה שגיאה: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "שגיאה",
        description: `אירעה שגיאה: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Update document title and meta description for SEO
  useEffect(() => {
    document.title = "התחברות - מינרל גז | אביגל טורג'מן";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'התחברות למערכת מינרל גז - שירות מקצועי למכירת בלוני גז ומוצרי חימום. הזן את פרטי ההתחברות שלך.');
    }
  }, []);

  // If already authenticated, redirect to the appropriate page
  if (isAuthenticated) {
    return user?.role === "admin" 
      ? <Navigate to="/admin/dashboard" /> 
      : <Navigate to="/catalog" />;
  }

  return (
    <>
      <SEOHead
        title="התחברות - מינרל גז | אביגל טורג'מן"
        description="התחברות למערכת מינרל גז - שירות מקצועי למכירת בלוני גז ומוצרי חימום. הזן את פרטי ההתחברות שלך."
        keywords="התחברות, מינרל גז, אביגל טורג'מן, בלוני גז, מוצרי חימום, מערכת הזמנות"
        canonical="https://mineral-gas.com"
      />
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-bottle-50 to-white">
        <div className="w-full max-w-md mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/assets/logo.png" alt="מינרל גז - אביגל טורג'מן" className="h-20 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">מינרל גז</h1>
            <p className="text-lg text-stone-600 mb-1">אביגל טורג'מן</p>
            <p className="text-sm text-stone-500">
              שירות מקצועי למכירת בלוני גז ומוצרי חימום
            </p>
          </div>

          <Card className="w-full shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-xl">התחברות למערכת</CardTitle>
              <CardDescription>
                הזן את פרטי ההתחברות שלך
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
                      מספר הזיהוי שקיבלת ממינרל גז
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
                    <a className="text-sm text-bottle-600 hover:underline">
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "מתחבר..." : "התחברות"}
                </Button>
                <div className="text-center text-sm text-stone-500">
                  לשאלות בנוגע לחשבון, פנה למנהל המערכת
                </div>
              </CardFooter>
            </form>
          </Card>
          
          {/* Footer Section */}
          <div className="mt-8 text-center">
            <div className="flex justify-center space-x-6 text-sm text-stone-500">
              <div className="flex items-center">
                <span className="ml-1">📞</span>
                <span>+972-XX-XXXXXXX</span>
              </div>
              <div className="flex items-center">
                <span className="ml-1">🕒</span>
                <span>א׳-ה׳ 08:00-17:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
