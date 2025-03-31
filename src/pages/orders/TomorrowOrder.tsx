
import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  product_id: string;
  day_of_week: string;
  quantity: number;
  product_name?: string;
}

const TomorrowOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [tomorrowItems, setTomorrowItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get tomorrow's day of the week in lowercase English (e.g., 'monday', 'tuesday')
  const tomorrow = addDays(new Date(), 1);
  const tomorrowDayLower = format(tomorrow, 'EEEE').toLowerCase();
  
  // Mapping for Hebrew day names
  const dayMapping: Record<string, string> = {
    'sunday': 'ראשון',
    'monday': 'שני',
    'tuesday': 'שלישי',
    'wednesday': 'רביעי',
    'thursday': 'חמישי',
    'friday': 'שישי',
    'saturday': 'שבת',
  };

  useEffect(() => {
    const fetchTomorrowOrders = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        // First, get active orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('id')
          .eq('customer_id', user.id)
          .eq('status', 'pending');

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
          return;
        }

        if (!orders || orders.length === 0) {
          setTomorrowItems([]);
          setLoading(false);
          return;
        }

        const orderIds = orders.map(order => order.id);

        // Get order items for tomorrow
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('id, order_id, product_id, day_of_week, quantity')
          .in('order_id', orderIds)
          .eq('day_of_week', tomorrowDayLower);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          return;
        }

        if (items && items.length > 0) {
          // Get product details for the items
          const productIds = [...new Set(items.map(item => item.product_id))];
          
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds);

          if (productsError) {
            console.error("Error fetching products:", productsError);
          }

          // Merge product names with items
          const enrichedItems = items.map(item => {
            const product = products?.find(p => p.id === item.product_id);
            return {
              ...item,
              product_name: product?.name || 'Unknown Product'
            };
          });

          setTomorrowItems(enrichedItems);
        } else {
          setTomorrowItems([]);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTomorrowOrders();
  }, [user, tomorrowDayLower]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleUpdateOrder = () => {
    toast({
      title: "פונקציונליות בפיתוח",
      description: "עדכון הזמנה למחר יהיה זמין בקרוב",
    });
    // In a real implementation, navigate to edit page for tomorrow's order
    // navigate('/orders/tomorrow/edit');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            חזרה לדף הבית
          </Button>
          <h1 className="text-2xl font-bold">הזמנה למחר</h1>
        </div>

        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3 text-blue-700">
            <CalendarIcon className="h-6 w-6" />
            <div>
              <p className="font-medium">יום {dayMapping[tomorrowDayLower] || tomorrowDayLower}</p>
              <p className="text-sm">{format(tomorrow, 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : tomorrowItems.length > 0 ? (
          <div>
            <h2 className="text-lg font-medium mb-4 text-right">פריטים מוזמנים ליום מחר:</h2>
            <div className="space-y-3 mb-6">
              {tomorrowItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <Badge>{item.quantity}×</Badge>
                    <p className="font-medium">{item.product_name}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Button onClick={handleUpdateOrder}>
                עדכון הזמנה למחר
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="font-medium text-lg">אין הזמנות למחר</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו פריטים מוזמנים עבור יום מחר
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

export default TomorrowOrder;
