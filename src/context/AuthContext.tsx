
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  logout: () => {},
  updateUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Check if there's a saved auth state in localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser) as User;
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, use the custom_users table with the RPC function
      const { data, error } = await supabase.rpc('verify_user_password', {
        user_phone: phone,
        user_password: password
      });

      if (error) {
        console.error("Login error:", error);
        toast({
          title: "התחברות נכשלה",
          description: "שם משתמש או סיסמה לא נכונים",
          variant: "destructive",
        });
        return false;
      }

      if (data && data.length > 0) {
        const userData = data[0];
        
        // Create a User object from the response
        const authenticatedUser: User = {
          id: userData.id,
          phone: userData.phone,
          name: userData.name,
          role: userData.role as "admin" | "customer",
          isVerified: userData.is_verified,
        };

        // Store user in state and localStorage
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
        return true;
      }
      
      toast({
        title: "התחברות נכשלה",
        description: "שם משתמש או סיסמה לא נכונים",
        variant: "destructive",
      });
      return false;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "שגיאת התחברות",
        description: "אירעה שגיאה בעת נסיון ההתחברות",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
  };

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error("No authenticated user");
    }

    try {
      // Update the user object with the new data
      const updatedUser = { ...user, ...data };
      
      // In a real app, you would call an API here to update the user profile
      // For now, we'll just update the local state
      setUser(updatedUser);
      
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
