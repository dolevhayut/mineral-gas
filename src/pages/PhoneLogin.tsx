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
import { toast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const PhoneLogin = () => {
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'whatsapp' | 'sms'>('whatsapp');

  const { loginWithPhone, sendVerificationCode, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to the appropriate dashboard
  if (isAuthenticated) {
    return user?.role === "admin" 
      ? <Navigate to="/admin/dashboard" /> 
      : <Navigate to="/dashboard" />;
  }

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove any non-digit characters
    let value = e.target.value.replace(/[^\d]/g, '');
    
    // Ensure it starts with 0 and limit to 10 digits
    if (value.length > 0 && !value.startsWith('0')) {
      value = '0' + value;
    }
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setPhone(value);
  };

  // Handle verification code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 6 characters
    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
    setVerificationCode(value);
  };

  // Send verification code
  const handleSendCode = async () => {
    if (!phone || phone.length !== 10) {
      setErrorMessage("מספר טלפון חייב להיות 10 ספרות");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const success = await sendVerificationCode(phone, selectedMethod);
      if (success) {
        setIsCodeSent(true);
      }
    } catch (error) {
      console.error("Error sending code:", error);
      setErrorMessage("אירעה שגיאה בשליחת הקוד");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code and login
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorMessage("קוד האימות חייב להיות 6 ספרות");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const success = await loginWithPhone(phone, verificationCode);
      if (success) {
        navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        setErrorMessage("קוד שגוי או שהמשתמש לא קיים במערכת");
      }
    } catch (error) {
      console.error("Error verifying code:", error);
      setErrorMessage("אירעה שגיאה באימות הקוד");
    } finally {
      setIsLoading(false);
    }
  };


  // Reset form
  const handleReset = () => {
    setPhone("");
    setVerificationCode("");
    setIsCodeSent(false);
    setErrorMessage(null);
    setSelectedMethod('whatsapp');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="flex justify-center mb-8">
        <img src="/assets/logo.png" alt="מינרל גז - אביגל טורג'מן" className="h-24 w-auto" />
      </div>
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl text-black">ברוכים הבאים</CardTitle>
          <CardDescription className="text-lg text-black">
            לביצוע הזמנה יש להתחבר למערכת
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>שגיאה</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {!isCodeSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-right block">
                  מספר טלפון
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="0501234567"
                  className="text-center"
                  dir="ltr"
                  inputMode="tel"
                />
                <div className="text-xs text-center text-muted-foreground">
                  הזן את מספר הטלפון שלך (10 ספרות)
                </div>
              </div>

              {/* Method Selection */}
              <div className="space-y-2">
                <Label className="text-right block">
                  בחר שיטת שליחה
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={selectedMethod === 'whatsapp' ? 'default' : 'outline'}
                    onClick={() => setSelectedMethod('whatsapp')}
                    className={`flex-1 ${selectedMethod === 'whatsapp' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  >
                    <i className="fab fa-whatsapp mr-2"></i>
                    WhatsApp
                  </Button>
                  <Button
                    type="button"
                    variant={selectedMethod === 'sms' ? 'default' : 'outline'}
                    onClick={() => setSelectedMethod('sms')}
                    className={`flex-1 ${selectedMethod === 'sms' ? 'bg-gray-800 hover:bg-gray-900 text-white' : ''}`}
                  >
                    <i className="fas fa-sms mr-2"></i>
                    SMS
                  </Button>
                </div>
              </div>
              
              <Button
                onClick={handleSendCode}
                disabled={isLoading || phone.length !== 10}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white"
              >
                {isLoading ? "שולח קוד..." : `שלח קוד אימות ב-${selectedMethod === 'whatsapp' ? 'WhatsApp' : 'SMS'}`}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-right block">
                  קוד אימות
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  placeholder="123456"
                  className="text-center text-2xl font-bold"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                />
                <div className="text-xs text-center text-muted-foreground">
                  הזן את הקוד בן 6 הספרות שנשלח {selectedMethod === 'whatsapp' ? 'בווטסאפ' : 'ב-SMS'} למספר {phone}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleVerifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {isLoading ? "מאמת..." : "אמת קוד"}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  חזור
                </Button>
              </div>
            </div>
          )}
        </CardContent>

      </Card>
      
      {/* Footer */}
      <footer className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          נבנה על ידי בולדוג פתרונות מדיה 2025 ©
        </div>
      </footer>
    </div>
  );
};

export default PhoneLogin;
