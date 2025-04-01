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

const UserDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      title: "הזמנה חדשה",
      icon: <PlusIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/new")
    },
    {
      title: "ביצוע או עדכון הזמנה קיימת",
      icon: <PencilIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/current")
    },
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
      title: "צפייה בהיסטוריה",
      icon: <HistoryIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders")
    }
  ];

  // Sample system updates - in a real app, these would come from the backend
  const systemUpdates = [
    {
      id: 1,
      date: "24/07/2023",
      content: "המאפייה תהיה סגורה בתאריך 30/07 עקב שיפוצים."
    },
    {
      id: 2,
      date: "18/07/2023",
      content: "מוצר חדש! לחם כוסמין מלא זמין עכשיו להזמנה."
    }
  ];

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
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
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 mb-6 shadow-sm">
          <h1 className="text-xl font-serif font-bold text-right">
            {`שלום, ${user?.name || 'לקוח'}`}
          </h1>
          <p className="text-gray-600 text-right text-sm">ברוכים הבאים למערכת הזמנות מאפיית אורבר</p>
        </div>
        
        {/* Active Order Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-right flex items-center">
            <PackageIcon className="ml-2 h-5 w-5 text-bakery-600" />
            הזמנה פעילה
          </h2>
          <Separator className="mb-4" />
          
          {isLoading ? (
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">טוען...</p>
            </Card>
          ) : activeOrder ? (
            <Card className="p-4 border-2 border-bakery-100">
              <div className="flex flex-col">
                <div className="text-right">
                  <h3 className="font-medium mb-1">הזמנה מספר {formatOrderId(activeOrder.id)}</h3>
                  <div dir="rtl" className="text-sm text-muted-foreground mt-2">
                    <div className="flex flex-row mb-1">
                      <ClockIcon className="h-4 w-4 ml-2" />
                      <span>נוצר בתאריך: {formatDate(activeOrder.created_at)}</span>
                    </div>
                    {activeOrder.target_date && (
                      <div className="flex flex-row mb-1">
                        <CalendarIcon className="h-4 w-4 ml-2" />
                        <span>תאריך יעד: {formatDate(activeOrder.target_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/orders/edit/${activeOrder.id}`)}
                    className="flex items-center gap-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                    עריכה
                  </Button>
                  <p className="text-sm text-bakery-600 font-medium">סטטוס: ממתין לאישור</p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-4 bg-muted/50">
              <div className="flex justify-center flex-col items-center py-2">
                <AlertCircleIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-center text-muted-foreground">אין הזמנה פעילה כרגע</p>
                <Button 
                  variant="default" 
                  className="mt-3" 
                  onClick={() => navigate('/orders/new')}
                >
                  יצירת הזמנה חדשה
                </Button>
              </div>
            </Card>
          )}
        </div>
        
        {/* Action Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-right">פעולות מהירות</h2>
          <Separator className="mb-4" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionCards.map((card, index) => (
              <Card 
                key={index} 
                className="hover:bg-accent transition-colors cursor-pointer"
                onClick={card.action}
              >
                <div className="flex flex-row-reverse justify-between items-center p-4">
                  <div className="bg-bakery-50 p-2 rounded-full">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-medium text-right">{card.title}</h3>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* System Updates */}
        <div className="mb-20">
          <h2 className="text-xl font-bold mb-3 text-right flex items-center">
            <BellIcon className="ml-2 h-5 w-5 text-bakery-600" />
            עדכוני מערכת
          </h2>
          <Separator className="mb-4" />
          
          <div className="space-y-3">
            {systemUpdates.length > 0 ? (
              systemUpdates.map((update) => (
                <Card key={update.id} className="p-4 bg-gradient-to-r from-white to-gray-50 action-card">
                  <div className="text-right card-content">
                    <div className="flex justify-end items-center mb-2 rtl-flex action-card-item">
                      <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">{update.date}</span>
                    </div>
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
