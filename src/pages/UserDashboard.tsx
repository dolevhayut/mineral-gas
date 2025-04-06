import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  HistoryIcon, 
  PencilIcon, 
  CalendarIcon, 
  PlusIcon, 
  BellIcon,
  PackageIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ClockIcon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Define interface for Order type
interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
  target_date?: string;
}

// Define interface for system updates
interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_active: boolean;
  expiry_date: string | null;
}

const UserDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([]);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch system updates
  useEffect(() => {
    const fetchSystemUpdates = async () => {
      try {
        setIsLoadingUpdates(true);
        
        const { data, error } = await supabase
          .from('system_updates')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error("Error fetching system updates:", error);
          toast({
            title: "שגיאה בטעינת עדכוני מערכת",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        
        console.log("System updates loaded:", data);
        setSystemUpdates(data || []);
      } catch (error) {
        console.error("Unexpected error fetching updates:", error);
      } finally {
        setIsLoadingUpdates(false);
      }
    };
    
    fetchSystemUpdates();
  }, []);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      // Skip if no user ID is available
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        console.log("Fetching active order for user:", user.id);
        
        // Get customer ID for this user with improved error handling
        console.log("Querying customer with user_id:", user.id);
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id, user_id, name')
          .eq('user_id', user.id)
          .maybeSingle();
          
        console.log("Customer query result:", { customerData, customerError });
        
        if (customerError && customerError.code !== 'PGRST116') {
          console.error("Error fetching customer:", customerError);
          setIsLoading(false);
          return;
        }
        
        if (!customerData?.id) {
          console.log("No customer record found for user:", user.id);
          
          // Try a case-insensitive query as a fallback
          const { data: customersAlternative } = await supabase
            .from('customers')
            .select('id, user_id, name');
            
          console.log("All customers:", customersAlternative);
          console.log("Checking for case-insensitive match manually...");
          
          const matchingCustomer = customersAlternative?.find(
            c => c.user_id.toLowerCase() === user.id.toLowerCase()
          );
          
          if (matchingCustomer) {
            console.log("Found customer with case-insensitive match:", matchingCustomer);
            
            // Then fetch orders using customer ID
            console.log("Querying orders with customer_id:", matchingCustomer.id);
            const { data, error } = await supabase
              .from('orders')
              .select('*, order_items(*)')
              .eq('customer_id', matchingCustomer.id)
              .eq('status', 'pending')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
    
            if (error && error.code !== 'PGRST116') {
              console.error("Error fetching active order:", error);
            }
    
            console.log("Orders query result:", data);
            setActiveOrder(data || null);
            setIsLoading(false);
            return;
          }
          
          setIsLoading(false);
          return;
        }
        
        // Then fetch orders using customer ID
        console.log("Found customer, querying orders with customer_id:", customerData.id);
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_id', customerData.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching active order:", error);
        }

        console.log("Orders query result:", data);
        setActiveOrder(data || null);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveOrder();
  }, [user]);

  // Redirect admin users to admin dashboard
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" />;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const actionCards = [
    {
      title: "עדכון הזמנה למחר",
      icon: <CalendarIcon className="h-8 w-8 text-bakery-600" />,
      action: () => {
        if (activeOrder) {
          // Navigate to edit page with tomorrow parameter
          navigate(`/orders/edit/${activeOrder.id}?edit=tomorrow`);
        } else {
          toast({
            title: "אין הזמנה פעילה",
            description: "יש ליצור הזמנה חדשה תחילה",
            variant: "destructive"
          });
        }
      }
    },
    {
      title: "הזמנה קבועה",
      icon: <PencilIcon className="h-8 w-8 text-bakery-600" />,
      action: () => {
        if (activeOrder) {
          navigate(`/orders/edit/${activeOrder.id}`);
        } else {
          navigate("/orders/new");
        }
      }
    },
    {
      title: "צפייה בהיסטוריה",
      icon: <HistoryIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders")
    }
  ];

  // Format date helper for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  // Format date helper for system updates
  const formatUpdateDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Get current day in Hebrew
  const getHebrewDay = (date: Date) => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[date.getDay()];
  };

  // Format date in Hebrew (for header)
  const formatHebrewDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    return `יום ${getHebrewDay(date)}, ${day} ב${months[date.getMonth()]}`;
  };

  // Format order ID to be more readable
  const formatOrderId = (id: string) => {
    if (!id) return '';
    // Take first 8 characters of UUID
    return id.substring(0, 8);
  };

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section - Simplified */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start">
            <h1 className="text-xl font-serif font-bold text-right mb-2 md:mb-0">
              {`שלום, ${user?.name || 'לקוח'}`}
            </h1>
            <div className="text-gray-600 text-sm font-medium">
              {formatHebrewDate(currentDate)}
            </div>
          </div>
        </div>
        
        {/* Active Order Section - Hidden */}
        
        {/* Action Cards */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionCards.map((card, index) => (
              <Card 
                key={index} 
                className={`group hover:bg-bakery-50 ${card.title === "עדכון הזמנה למחר" ? 
                  "border-2 border-bakery-500 bg-bakery-100/70 shadow-lg" : 
                  "border-2 border-bakery-200 bg-gradient-to-l from-white to-bakery-50/30 shadow-md"} 
                  hover:border-bakery-400 transition-all duration-200 cursor-pointer relative overflow-hidden`}
                onClick={card.action}
              >
                <div className="flex flex-row-reverse justify-between items-center p-4">
                  <div className={`${card.title === "עדכון הזמנה למחר" ? "bg-bakery-200" : "bg-bakery-100"} p-2 rounded-full shadow-sm`}>
                    {card.icon}
                  </div>
                  <h3 className={`text-lg font-medium text-right ${card.title === "עדכון הזמנה למחר" ? "text-bakery-800" : ""}`}>{card.title}</h3>
                  <ArrowRightIcon className="h-5 w-5 text-bakery-400 absolute left-3 opacity-70 group-hover:opacity-100" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* System Updates - Simplified */}
        <div className="mb-20">
          <h2 className="text-xl font-bold mb-3 text-right flex items-center">
            <BellIcon className="ml-2 h-5 w-5 text-bakery-600" />
            עדכונים
          </h2>
          <Separator className="mb-4" />
          
          <div className="space-y-3">
            {isLoadingUpdates ? (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">טוען עדכונים...</p>
              </Card>
            ) : systemUpdates.length > 0 ? (
              systemUpdates.map((update) => (
                <Card key={update.id} className="p-4 bg-gradient-to-r from-white to-gray-50 action-card">
                  <div className="text-right card-content">
                    <div className="flex justify-end items-center mb-2 rtl-flex action-card-item">
                      <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">
                        {formatUpdateDate(update.created_at)}
                      </span>
                    </div>
                    <p className="text-right w-full font-medium mb-1">{update.title}</p>
                    <p className="text-right w-full">{update.content}</p>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-4">
                <p className="text-center text-muted-foreground">אין עדכונים חדשים</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayoutWithFooter>
  );
};

export default UserDashboard;
