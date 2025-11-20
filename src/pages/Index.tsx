import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { UserCheck, UserPlus, Phone, User, KeyIcon } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Form states
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Reset form when modal closes
  const resetForm = () => {
    setPhone("");
    setName("");
    setVerificationCode("");
    setShowCodeInput(false);
    setErrorMessage(null);
    setIsRegisterMode(false);
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    setPhone(value);
  };

  // Handle existing customer login
  const handleExistingCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      setIsRegisterMode(false);
      toast({
        title: "קוד נשלח בהצלחה",
        description: `קוד אימות נשלח למספר ${phone}`,
      });
      
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

  // Handle new customer registration
  const handleNewCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrorMessage("נא להזין שם מלא");
      toast({
        title: "שגיאת קלט",
        description: "נא להזין שם מלא",
        variant: "destructive"
      });
      return;
    }

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
      // Check if customer already exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('id, phone')
        .eq('phone', phone)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing customer:", checkError);
      }

      if (existingCustomer) {
        setErrorMessage("מספר הטלפון כבר רשום במערכת. נא להתחבר כלקוח קיים.");
        toast({
          title: "לקוח קיים",
          description: "מספר הטלפון כבר רשום במערכת. נא להתחבר כלקוח קיים.",
          variant: "destructive"
        });
        return;
      }

      // Create new customer
      const { data: createData, error: createError } = await supabase.functions.invoke(
        'create-or-get-customer',
        {
          body: { phone, name: name.trim() }
        }
      );

      if (createError) throw createError;

      if (createData?.customer) {
        // Send verification code
        const { data: codeData, error: codeError } = await supabase.rpc('send_verification_code', {
          p_phone: phone
        });
        
        if (codeError) throw codeError;
        
        setShowCodeInput(true);
        setIsRegisterMode(true);
        toast({
          title: "נרשמת בהצלחה!",
          description: `קוד אימות נשלח למספר ${phone}`,
        });
        
        if (codeData) {
          console.log("Verification code:", codeData);
          toast({
            title: "קוד אימות (למטרות פיתוח)",
            description: `הקוד שלך: ${codeData}`,
          });
        }
      } else {
        throw new Error("Failed to create customer");
      }
    } catch (error) {
      console.error("Registration error:", error);
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

  // Verify code
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
        const customer = result.customer;
        localStorage.setItem('mineral_gas_customer', JSON.stringify(customer));
        
        toast({
          title: isRegisterMode ? "ברוך הבא!" : "התחברות הצליחה",
          description: `${isRegisterMode ? 'נרשמת בהצלחה' : 'ברוך הבא'} ${customer.name || 'לקוח יקר'}!`,
        });

        navigate(customer.role === 'admin' ? '/admin/dashboard' : '/dashboard');
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

  // Business structured data for SEO
  const businessStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "מינרל גז - אביגל טורג'מן",
    "description": "שירות מקצועי למכירת בלוני גז, מחממי מים על גז, ציוד היקפי להתקנות ושירות לקוחות מעולה",
    "url": "https://mineral-gas.com",
    "telephone": "+972-54-3831333",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IL",
      "addressLocality": "ישראל"
    },
    "openingHours": "Mo-Fr 08:00-17:00, Sa 08:00-14:00",
    "priceRange": "$$"
  };

  return (
    <>
      <SEOHead
        title="מינרל גז - אביגל טורג'מן | בלוני גז ומוצרי חימום"
        description="מינרל גז - שירות מקצועי למכירת בלוני גז, מחממי מים על גז, ציוד היקפי להתקנות ושירות לקוחות מעולה."
        keywords="בלוני גז, מחממי מים, חימום, גז, אביגל טורג'מן, מינרל גז"
        canonical="https://mineral-gas.com"
        structuredData={businessStructuredData}
      />
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-bottle-50 via-white to-bottle-50">
        <div className="w-full max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-3">
              <img 
                src="/assets/logo.png" 
                alt="מינרל גז - אביגל טורג'מן" 
                className="h-20 w-auto drop-shadow-lg" 
              />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              <span className="text-bottle-600">מינרל גז</span>
            </h1>
            <p className="text-xl text-stone-700 mb-1">אביגל טורג'מן</p>
            <p className="text-sm text-stone-600 max-w-xl mx-auto">
              שירות מקצועי למכירת בלוני גז, מחממי מים על גז וציוד היקפי
            </p>
          </div>

          {/* Main Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Existing Customer */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-bottle-100 hover:border-bottle-300">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-bottle-100 rounded-full flex items-center justify-center">
                  <UserCheck className="h-8 w-8 text-bottle-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">לקוח קיים</h2>
                <p className="text-stone-600 text-sm">
                  כבר רשום במערכת? התחבר כדי לבצע הזמנה חדשה
                </p>
                <Button
                  size="default"
                  className="w-full bg-bottle-600 hover:bg-bottle-700 text-white"
                  onClick={() => {
                    resetForm();
                    setShowLoginModal(true);
                  }}
                >
                  התחבר למערכת
                </Button>
              </div>
            </div>

            {/* New Customer */}
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border-2 border-amber-100 hover:border-amber-300">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <UserPlus className="h-8 w-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">לקוח חדש</h2>
                <p className="text-stone-600 text-sm">
                  לקוח חדש? הירשם עכשיו והתחל להזמין בקלות
                </p>
                <Button
                  size="default"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => {
                    resetForm();
                    setShowRegisterModal(true);
                  }}
                >
                  הרשמה למערכת
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-stone-600 text-sm">
              <Phone className="h-4 w-4" />
              <span>צריך עזרה? התקשר אלינו:</span>
              <a 
                href="tel:0543831333" 
                className="text-bottle-600 font-semibold hover:text-bottle-700"
              >
                054-3831333
              </a>
            </div>
            <p className="text-xs text-stone-500">
              שעות פעילות: א׳-ה׳ 08:00-17:00 | ו׳ 08:00-14:00
            </p>
          </div>
        </div>

        {/* Floating Call Button */}
        <a
          href="tel:0543831333"
          className="fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-5 shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 hover:scale-95 group"
          aria-label="התקשר אלינו"
        >
          <Phone className="h-7 w-7 transition-transform" />
          <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            054-3831333
          </span>
        </a>

        {/* Login Modal - Existing Customer */}
        <Dialog open={showLoginModal} onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-md p-0 gap-0">
            {/* Header with Logo */}
            <div className="text-center pt-6 pb-4 px-6">
              <div className="flex justify-center mb-3">
                <img src="/assets/logo.png" alt="מינרל גז - אביגל טורג'מן" className="h-16 w-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">מינרל גז</h2>
              <p className="text-base text-stone-600 mb-1">אביגל טורג'מן</p>
              <p className="text-xs text-stone-500">
                שירות מקצועי למכירת בלוני גז ומוצרי חימום
              </p>
            </div>
            
            <div className="px-6 pb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">התחברות למערכת</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {showCodeInput 
                    ? "הזן את קוד האימות שנשלח אליך" 
                    : "הזן את מספר הטלפון שלך"}
                </p>
              </div>
              
              <div className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>שגיאה</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {!showCodeInput ? (
                  <form onSubmit={handleExistingCustomerLogin}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-phone" className="text-right block">
                          מספר טלפון
                        </Label>
                        <Input
                          id="login-phone"
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
                      <Label htmlFor="login-code" className="text-center block">
                        קוד אימות
                      </Label>
                      <Input
                        id="login-code"
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

                <div className="pt-4 border-t text-center text-sm text-stone-600">
                  לקוח חדש?{" "}
                  <button
                    onClick={() => {
                      setShowLoginModal(false);
                      resetForm();
                      setShowRegisterModal(true);
                    }}
                    className="text-amber-600 hover:text-amber-700 font-medium underline"
                  >
                    הירשם כאן
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Register Modal - New Customer */}
        <Dialog open={showRegisterModal} onOpenChange={(open) => {
          setShowRegisterModal(open);
          if (!open) resetForm();
        }}>
          <DialogContent className="sm:max-w-md p-0 gap-0">
            {/* Header with Logo */}
            <div className="text-center pt-6 pb-4 px-6">
              <div className="flex justify-center mb-3">
                <img src="/assets/logo.png" alt="מינרל גז - אביגל טורג'מן" className="h-16 w-auto" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">מינרל גז</h2>
              <p className="text-base text-stone-600 mb-1">אביגל טורג'מן</p>
              <p className="text-xs text-stone-500">
                שירות מקצועי למכירת בלוני גז ומוצרי חימום
              </p>
            </div>
            
            <div className="px-6 pb-6">
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold">הרשמה למערכת</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {showCodeInput 
                    ? "הזן את קוד האימות שנשלח אליך" 
                    : "הזן את הפרטים שלך כדי להירשם"}
                </p>
              </div>
              
              <div className="space-y-4">
                {errorMessage && (
                  <Alert variant="destructive">
                    <AlertTitle>שגיאה</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                
                {!showCodeInput ? (
                  <form onSubmit={handleNewCustomerRegister}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name" className="text-right block">
                          שם מלא
                        </Label>
                        <Input
                          id="register-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="text-right"
                          placeholder="הזן שם מלא"
                          autoComplete="name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-phone" className="text-right block">
                          מספר טלפון
                        </Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          required
                          className="text-right"
                          dir="ltr"
                          placeholder="05XXXXXXXX"
                          inputMode="tel"
                          maxLength={10}
                          autoComplete="tel"
                        />
                        <div className="text-xs text-right text-muted-foreground">
                          הזן מספר טלפון ישראלי (10 ספרות)
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700"
                        disabled={isLoading || phone.length !== 10 || !name.trim()}
                      >
                        {isLoading ? "מבצע רישום..." : "הירשם והמשך"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-code" className="text-center block">
                        קוד אימות
                      </Label>
                      <Input
                        id="register-code"
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
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? "מאמת..." : "אמת והשלם רישום"}
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
                      חזור לשינוי פרטים
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t text-center text-sm text-stone-600">
                  כבר רשום?{" "}
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      resetForm();
                      setShowLoginModal(true);
                    }}
                    className="text-bottle-600 hover:text-bottle-700 font-medium underline"
                  >
                    התחבר כאן
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Index;
