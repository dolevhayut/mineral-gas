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
import { KeyIcon } from "lucide-react";
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
      
      const result = data as { success?: boolean; customer?: any; message?: string } | null;
      
      if (result?.success) {
        // Login successful
        const customer = result.customer;
        
        // Store customer data in local storage
        localStorage.setItem('mineral_gas_customer', JSON.stringify(customer));
        
        // Navigate based on role
        navigate(customer.role === 'admin' ? '/admin/dashboard' : '/dashboard');
        
        toast({
          title: "התחברות הצליחה",
          description: `ברוך הבא ${customer.name || 'לקוח יקר'}!`,
        });
      } else {
        setErrorMessage(result?.message || "קוד אימות שגוי");
        toast({
          title: "שגיאה",
          description: result?.message || "קוד אימות שגוי",
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
      : <Navigate to="/dashboard" />;
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
                {showCodeInput 
                  ? "הזן את קוד האימות שנשלח אליך" 
                  : "הזן את מספר הטלפון שלך"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTitle>שגיאה</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {!showCodeInput ? (
                <form onSubmit={handleSendCode}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2 justify-end">
                        <span>מספר טלפון</span>
                        <KeyIcon className="h-4 w-4" />
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                        className="text-right"
                        dir="ltr"
                        placeholder="05XXXXXXXX"
                        inputMode="tel"
                        maxLength={10}
                      />
                      <div className="text-xs text-right text-muted-foreground">
                        הזן מספר טלפון ישראלי (10 ספרות)
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-bottle-600 hover:bg-bottle-700"
                      disabled={isLoading || phone.length !== 10}
                    >
                      {isLoading ? "שולח קוד..." : "שלח קוד אימות"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="flex items-center gap-2 justify-end">
                      <span>קוד אימות</span>
                      <KeyIcon className="h-4 w-4" />
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className="text-center text-2xl tracking-widest"
                      dir="ltr"
                      placeholder="------"
                      inputMode="numeric"
                      maxLength={6}
                    />
                    <div className="text-xs text-center text-muted-foreground">
                      קוד בן 6 ספרות נשלח ל-{phone}
                    </div>
                  </div>
                  <Button
                    onClick={handleVerifyCode}
                    className="w-full bg-bottle-600 hover:bg-bottle-700"
                    disabled={isLoading || verificationCode.length !== 6}
                  >
                    {isLoading ? "מאמת..." : "אמת והתחבר"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCodeInput(false);
                      setVerificationCode("");
                      setErrorMessage(null);
                    }}
                    className="w-full"
                  >
                    חזור לשינוי מספר טלפון
                  </Button>
                </div>
              )}
            </CardContent>
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
