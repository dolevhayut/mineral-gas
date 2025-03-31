import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (sapCustomerId: string, password: string) => Promise<boolean>;
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
        console.log("Loaded saved user from localStorage:", parsedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const login = async (sapCustomerId: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with SAP ID:", sapCustomerId, "and phone:", password);
      
      // First try to get the user by SAP ID only
      const { data: userBySap, error: sapError } = await supabase
        .from('custom_users')
        .select('*')
        .eq('sap_customer_id', sapCustomerId)
        .maybeSingle();

      console.log("Query by SAP ID result:", { userBySap, sapError });

      if (sapError) {
        console.error("SAP ID query error:", sapError);
        toast({
          title: "התחברות נכשלה",
          description: `שגיאת שרת: ${sapError.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (!userBySap) {
        console.log("No user found with this SAP ID");
        toast({
          title: "התחברות נכשלה",
          description: "מזהה לקוח לא נמצא",
          variant: "destructive",
        });
        return false;
      }

      console.log("Found user:", userBySap);
      console.log("Comparing phones:", {
        stored: userBySap.phone,
        input: password,
        match: userBySap.phone === password
      });

      // Now check if the phone matches
      if (userBySap.phone === password) {
        const authenticatedUser: User = {
          id: userBySap.id,
          phone: userBySap.phone,
          name: userBySap.name,
          role: userBySap.role as "admin" | "customer",
          isVerified: userBySap.is_verified,
          sapCustomerId: userBySap.sap_customer_id,
        };

        console.log("Authentication successful, user:", authenticatedUser);
        
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
        
        toast({
          title: "ברוכים הבאים",
          description: `התחברת בהצלחה, ${authenticatedUser.name}`,
        });
        
        return true;
      }
      
      console.log("Phone number doesn't match");
      toast({
        title: "התחברות נכשלה",
        description: "מספר טלפון שגוי",
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
