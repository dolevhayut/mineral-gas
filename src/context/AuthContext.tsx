
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (sapCustomerId: string, phone: string) => Promise<boolean>;
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

  const login = async (sapCustomerId: string, phone: string): Promise<boolean> => {
    try {
      console.log("Attempting login with SAP ID:", sapCustomerId, "and phone:", phone);
      
      // Format phone number for consistency
      let formattedPhone = phone;
      
      // Remove leading + if it exists, to ensure consistent format
      if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1);
      }

      // Remove any non-digit characters
      formattedPhone = formattedPhone.replace(/\D/g, '');
      
      // Add + back for the database query
      formattedPhone = '+' + formattedPhone;
      
      console.log("Formatted phone:", formattedPhone);
      
      // Query for user verification - note we're checking phone as both input and password
      const { data, error } = await supabase.rpc('verify_user_password', {
        user_phone: formattedPhone,
        user_password: formattedPhone  // Using formatted phone as password
      });

      console.log("Login response data:", data);
      
      if (error) {
        console.error("Login RPC error:", error);
        toast({
          title: "התחברות נכשלה",
          description: `שגיאת שרת: ${error.message}`,
          variant: "destructive",
        });
        return false;
      }

      if (data && data.length > 0) {
        // Find the user with matching SAP customer ID
        const matchingUser = data.find(user => user.sap_customer_id === sapCustomerId);
        
        if (!matchingUser) {
          console.log("Authentication failed: No matching SAP customer ID found");
          toast({
            title: "התחברות נכשלה",
            description: "מזהה לקוח לא נמצא במערכת",
            variant: "destructive",
          });
          return false;
        }
        
        // Create a User object from the response
        const authenticatedUser: User = {
          id: matchingUser.id,
          phone: matchingUser.phone,
          name: matchingUser.name,
          role: matchingUser.role as "admin" | "customer",
          isVerified: matchingUser.is_verified,
          sapCustomerId: matchingUser.sap_customer_id, // Make sure we include sap_customer_id
        };

        console.log("Authentication successful, user:", authenticatedUser);
        
        // Store user in state and localStorage
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
        
        toast({
          title: "ברוכים הבאים",
          description: `התחברת בהצלחה, ${authenticatedUser.name}`,
        });
        
        return true;
      }
      
      console.log("Authentication failed: No matching user found");
      toast({
        title: "התחברות נכשלה",
        description: "מזהה לקוח או סיסמה לא נכונים",
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
