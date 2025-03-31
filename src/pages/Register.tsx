import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";

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
      <div className="container mx-auto max-w-md py-24">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Create an account</h2>
            <p className="text-muted-foreground">
              Enter your details below to create your account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                type="text"
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                id="phone"
                placeholder="+1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                id="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          <p className="text-sm text-center">
            Already have an account?{" "}
            <Button variant="link" onClick={() => navigate("/login")}>
              Log in
            </Button>
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Register;
