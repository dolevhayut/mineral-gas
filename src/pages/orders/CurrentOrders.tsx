
import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
}

const CurrentOrders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching orders:", error);
          toast({
            title: "שגיאה בטעינת הזמנות",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        setOrders(data || []);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleEditOrder = (orderId: string) => {
    toast({
      title: "פונקציונליות בפיתוח",
      description: "עריכת הזמנה תהיה זמינה בקרוב",
    });
    // In a real implementation, navigate to edit page
    // navigate(`/orders/edit/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) {
        console.error("Error cancelling order:", error);
        toast({
          title: "שגיאה בביטול ההזמנה",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update the orders list
      setOrders(orders.filter(order => order.id !== orderId));
      
      toast({
        title: "ההזמנה בוטלה בהצלחה",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            חזרה לדף הבית
          </Button>
          <h1 className="text-2xl font-bold">הזמנות נוכחיות</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between">
                    <Badge variant="outline">{order.status === 'pending' ? 'ממתין לאישור' : order.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="font-medium">מס' הזמנה: {order.id.substring(0, 8)}</p>
                      <p>סכום: {formatCurrency(order.total)}</p>
                    </div>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditOrder(order.id)}
                      >
                        עריכה
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="font-medium text-lg">אין הזמנות פעילות</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו הזמנות ממתינות במערכת
            </p>
            <Button onClick={() => navigate('/orders/new')}>
              ליצירת הזמנה חדשה
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CurrentOrders;
