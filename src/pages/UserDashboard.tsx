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
  ArrowRightIcon
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const UserDashboard = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect admin users to admin dashboard
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" />;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    if (!user?.id) return;
    
    const fetchActiveOrder = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching active order:", error);
        }

        setActiveOrder(data);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveOrder();
  }, [user]);

  const actionCards = [
    {
      title: "הזמנה חדשה",
      icon: <PlusIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/new"),
    },
    {
      title: "ביצוע או עדכון הזמנה קיימת",
      icon: <PencilIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/current"),
    },
    {
      title: "עדכון הזמנה למחר",
      icon: <CalendarIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders/tomorrow"),
    },
    {
      title: "צפייה בהיסטוריה",
      icon: <HistoryIcon className="h-8 w-8 text-bakery-600" />,
      action: () => navigate("/orders"),
    },
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
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mb-8 shadow-sm">
          <h1 className="text-2xl font-serif font-bold text-right">
            {`שלום, ${user?.name || 'לקוח'}`}
          </h1>
          <p className="text-gray-600 text-right mt-1">ברוכים הבאים לאורבר - מערכת הזמנות המאפיה</p>
        </div>
        
        {/* Active Order Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-3 text-right flex items-center">
            <PackageIcon className="ml-2 h-5 w-5 text-bakery-600" />
            ה��מנה פעילה
          </h2>
          <Separator className="mb-4" />
          
          {isLoading ? (
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">טוען...</p>
            </Card>
          ) : activeOrder ? (
            <Card className="p-4 border-2 border-bakery-100">
              <div className="flex justify-between items-start">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/orders/current')} 
                  className="flex items-center"
                >
                  <span>לעדכון</span>
                  <ArrowRightIcon className="mr-2 h-4 w-4" />
                </Button>
                <div className="text-right">
                  <h3 className="font-medium mb-1">הזמנה מספר {activeOrder.id.substring(0, 8)}</h3>
                  <p className="text-sm text-muted-foreground">{formatDate(activeOrder.created_at)}</p>
                </div>
              </div>
              <Separator className="my-3" />
              <p className="text-sm text-right">
                {activeOrder.order_items?.length > 0 
                  ? `${activeOrder.order_items.length} פריטים בהזמנה` 
                  : 'אין פריטים בהזמנה'}
              </p>
              <p className="text-sm text-bakery-600 font-medium text-right">סטטוס: ממתין לאישור</p>
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
                <div className="p-4 flex items-center justify-between">
                  <ArrowRightIcon className="h-5 w-5 text-bakery-600" />
                  <div className="flex items-center">
                    <span className="text-lg font-medium">{card.title}</span>
                    <div className="mr-3 bg-bakery-50 p-2 rounded-full">
                      {card.icon}
                    </div>
                  </div>
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
                <Card key={update.id} className="p-4 bg-gradient-to-r from-white to-gray-50">
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground bg-gray-100 px-2 py-1 rounded-md">{update.date}</span>
                    <p className="text-right flex-1 mr-4">{update.content}</p>
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
