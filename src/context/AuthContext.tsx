import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (sapCustomerId: string, password: string) => Promise<boolean>;
  loginWithPhone: (phone: string, verificationCode: string) => Promise<boolean>;
  sendVerificationCode: (phone: string, method?: 'whatsapp' | 'sms') => Promise<boolean>;
  registerCustomer: (customerData: RegisterCustomerData) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

interface RegisterCustomerData {
  phone: string;
  name: string;
  address?: string;
  delivery_instructions?: string;
  emergency_contact?: string;
  preferred_delivery_time?: string;
  gas_supplier_license?: string;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => false,
  loginWithPhone: async () => false,
  sendVerificationCode: async () => false,
  registerCustomer: async () => false,
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
    const loadSavedSession = async () => {
      const savedUser = localStorage.getItem("mineral_gas_customer");
      const sessionExpiry = localStorage.getItem("mineral_gas_session_expiry");
      
      if (savedUser && sessionExpiry) {
        try {
          const parsedUser = JSON.parse(savedUser) as User;
          const expiryTime = parseInt(sessionExpiry);
          const now = Date.now();
          
          // Check if session is still valid (30 days)
          if (now < expiryTime) {
            console.log("Loaded saved user from localStorage:", parsedUser);
            
            // Verify user still exists in database
            const { data: customerData, error } = await supabase
              .from('customers')
              .select('id, name, phone, role, is_verified')
              .eq('id', parsedUser.id)
              .single();
            
            if (!error && customerData) {
              // Update user with fresh data from DB
              const refreshedUser: User = {
                id: customerData.id,
                phone: customerData.phone,
                name: customerData.name || "לקוח",
                role: customerData.role as "admin" | "customer",
                isVerified: customerData.is_verified || false,
                sapCustomerId: parsedUser.sapCustomerId,
              };
              
              setUser(refreshedUser);
              setIsAuthenticated(true);
              
              // Update localStorage with fresh data
              localStorage.setItem("mineral_gas_customer", JSON.stringify(refreshedUser));
              console.log("Session restored and refreshed from database");
            } else {
              // User no longer exists in database
              console.log("User not found in database, clearing session");
              localStorage.removeItem("mineral_gas_customer");
              localStorage.removeItem("mineral_gas_session_expiry");
            }
          } else {
            // Session expired
            console.log("Session expired, clearing localStorage");
            localStorage.removeItem("mineral_gas_customer");
            localStorage.removeItem("mineral_gas_session_expiry");
          }
        } catch (error) {
          console.error("Error parsing saved user:", error);
          localStorage.removeItem("mineral_gas_customer");
          localStorage.removeItem("mineral_gas_session_expiry");
        }
      }
    };
    
    loadSavedSession();
  }, []);

  const login = async (sapCustomerId: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login with SAP ID:", sapCustomerId, "and phone:", password);
      
      // First try to get the user by SAP ID only
      const { data: userBySap, error: sapError } = await supabase
        .from('customers')
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
    localStorage.removeItem("mineral_gas_customer");
    localStorage.removeItem("mineral_gas_session_expiry");
    
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
  };

  const sendVerificationCode = async (phone: string, method: 'whatsapp' | 'sms' = 'whatsapp'): Promise<boolean> => {
    try {
      console.log("Sending verification code to phone:", phone, "method:", method);
      
      // Call Edge Function that sends via WhatsApp or SMS via Make.com webhook
      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: { phone, method }
      });

      if (error) {
        console.error("Error sending verification code:", error);
        toast({
          title: "שגיאה בשליחת קוד",
          description: error.message || "אירעה שגיאה בשליחת קוד האימות",
          variant: "destructive",
        });
        return false;
      }

      if (!data?.success) {
        toast({
          title: "שגיאה בשליחת קוד",
          description: data?.error || "אירעה שגיאה בשליחת קוד האימות",
          variant: "destructive",
        });
        return false;
      }

      const methodText = method === 'whatsapp' ? 'בווטסאפ' : 'ב-SMS';
      toast({
        title: "קוד אימות נשלח",
        description: `קוד האימות נשלח ${methodText} למספר הטלפון שלך`,
      });

      // In development, show the code if returned
      if (import.meta.env.DEV && data?.verification_code) {
        console.log("Verification code (dev only):", data.verification_code);
        toast({
          title: "קוד אימות (למטרות פיתוח)",
          description: `הקוד שלך: ${data.verification_code}`,
        });
      }

      return true;
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast({
        title: "שגיאה בשליחת קוד",
        description: "אירעה שגיאה בשליחת קוד האימות",
        variant: "destructive",
      });
      return false;
    }
  };

  const loginWithPhone = async (phone: string, verificationCode: string): Promise<boolean> => {
    try {
      console.log("Attempting phone login with:", phone, "code:", verificationCode);
      
      // Call Edge Function for verification
      const { data, error } = await supabase.functions.invoke('verify-phone-code', {
        body: { phone, code: verificationCode }
      });

      if (error) {
        console.error("Error verifying phone code:", error);
        toast({
          title: "אימות נכשל",
          description: error.message || "קוד האימות שגוי או פג תוקף",
          variant: "destructive",
        });
        return false;
      }

      if (!data?.success) {
        toast({
          title: "אימות נכשל",
          description: data?.error || "קוד האימות שגוי או פג תוקף",
          variant: "destructive",
        });
        return false;
      }

      if (data.user) {
        // Fetch fresh customer data from database
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (customerError || !customerData) {
          console.error("Error fetching customer data:", customerError);
          toast({
            title: "שגיאה בטעינת נתוני משתמש",
            description: "אנא נסה שוב",
            variant: "destructive",
          });
          return false;
        }

        const authenticatedUser: User = {
          id: customerData.id,
          phone: customerData.phone,
          name: customerData.name || "לקוח",
          role: customerData.role as "admin" | "customer",
          isVerified: customerData.is_verified || false,
          sapCustomerId: null, // No longer using SAP ID
        };

        console.log("Phone authentication successful, user:", authenticatedUser);
        
        setUser(authenticatedUser);
        setIsAuthenticated(true);
        
        // Save user data and session expiry (30 days from now)
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        localStorage.setItem("mineral_gas_customer", JSON.stringify(authenticatedUser));
        localStorage.setItem("mineral_gas_session_expiry", expiryTime.toString());
        
        toast({
          title: "ברוכים הבאים",
          description: `התחברת בהצלחה, ${authenticatedUser.name}`,
        });
        
        return true;
      }

      // If no user data returned, customer not registered
      toast({
        title: "לקוח לא רשום",
        description: "מספר הטלפון לא רשום במערכת. פנה לשירות לקוחות",
        variant: "destructive",
      });
      
      return false;
    } catch (error) {
      console.error("Phone login error:", error);
      toast({
        title: "שגיאת התחברות",
        description: "אירעה שגיאה בעת נסיון ההתחברות",
        variant: "destructive",
      });
      return false;
    }
  };

  const registerCustomer = async (customerData: RegisterCustomerData): Promise<boolean> => {
    try {
      console.log("Registering new customer:", customerData);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error registering customer:", data);
        toast({
          title: "רישום נכשל",
          description: data.error || "אירעה שגיאה ברישום הלקוח",
          variant: "destructive",
        });
        return false;
      }

      const authenticatedUser: User = {
        id: data.user.id,
        phone: data.user.phone,
        name: data.user.name,
        role: data.user.role as "admin" | "customer",
        isVerified: true,
        sapCustomerId: null, // No longer using SAP ID
      };

      console.log("Customer registration successful, user:", authenticatedUser);
      
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(authenticatedUser));
      
      toast({
        title: "ברוכים הבאים",
        description: `שמתך הושלמה בהצלחה, ${authenticatedUser.name}`,
      });
      
      return true;
    } catch (error) {
      console.error("Customer registration error:", error);
      toast({
        title: "שגיאה ברישום",
        description: "אירעה שגיאה ברישום הלקוח",
        variant: "destructive",
      });
      return false;
    }
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
    loginWithPhone,
    sendVerificationCode,
    registerCustomer,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
