
import { User } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("bakery_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Use our custom SQL function to verify the user's credentials
      const { data, error } = await supabase
        .rpc('verify_user_password', {
          user_phone: phone,
          user_password: password
        });

      if (error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      if (data && data.length > 0) {
        const userData: User = {
          id: data[0].id,
          phone: data[0].phone,
          name: data[0].name,
          role: data[0].role as 'admin' | 'customer',
          sapCustomerId: data[0].sap_customer_id,
          isVerified: data[0].is_verified
        };

        setUser(userData);
        localStorage.setItem("bakery_user", JSON.stringify(userData));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${userData.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid phone number or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bakery_user");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
