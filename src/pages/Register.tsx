
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc("add_custom_user", {
        user_name: name,
        user_phone: phone,
        user_password: password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Account created!",
        description: "You can now log in with your new account.",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-md py-12 px-4 auth-container">
        <Card className="border-bakery-200 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">הרשמה לחשבון חדש</CardTitle>
            <CardDescription className="text-center">
              הזינו את הפרטים שלכם כדי ליצור חשבון
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">שם</Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="הזינו את השם שלכם"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-bakery-200 focus:ring-bakery-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">מספר טלפון</Label>
                <Input
                  type="tel"
                  id="phone"
                  placeholder="+972501234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="border-bakery-200 focus:ring-bakery-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  type="password"
                  id="password"
                  placeholder="הזינו סיסמה"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-bakery-200 focus:ring-bakery-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">אימות סיסמה</Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  placeholder="אימות סיסמה"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-bakery-200 focus:ring-bakery-500"
                />
              </div>
              <Button disabled={isLoading} type="submit" className="w-full bg-bakery-500 hover:bg-bakery-600">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    יוצר חשבון...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    יצירת חשבון
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center">
              כבר יש לך חשבון?{" "}
              <Button variant="link" onClick={() => navigate("/login")} className="text-bakery-600 hover:text-bakery-800 px-1">
                התחברות
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Register;
