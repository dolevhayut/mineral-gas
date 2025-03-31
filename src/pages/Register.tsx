
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
import { useNavigate } from "react-router-dom";
import { CakeIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [sapId, setSapId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('add_custom_user', {
        user_name: name,
        user_phone: phone,
        user_password: password,
        user_role: 'customer',
        user_sap_id: sapId || null,
        user_is_verified: false
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now log in.",
      });
      
      setIsLoading(false);
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 auth-container" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <CakeIcon className="h-12 w-12 text-bakery-500" />
          </div>
          <CardTitle className="text-3xl">הרשמה</CardTitle>
          <CardDescription>
            צור חשבון משתמש חדש
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                placeholder="ישראל ישראלי"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="sapId">מספר לקוח SAP (אם יש)</Label>
              <Input
                id="sapId"
                placeholder="SAP123"
                value={sapId}
                onChange={(e) => setSapId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? "יוצר חשבון..." : "הרשמה"}
            </Button>
            <div className="text-center text-sm text-gray-500">
              <span>כבר יש לך חשבון? </span>
              <a
                className="text-bakery-600 hover:underline"
                onClick={() => navigate("/login")}
                style={{ cursor: "pointer" }}
              >
                התחברות
              </a>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Register;
