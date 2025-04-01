import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, ChevronDown, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  day_of_week: string;
  quantity: number;
  product_name?: string;
}

const OrderHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        console.log("Fetching orders for user ID:", user.id);
        
        if (!user.id || typeof user.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
          console.error("Invalid user ID format:", user.id);
          toast({
            title: "שגיאה בטעינת הזמנות",
            description: "פורמט מזהה משתמש לא תקין",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        // First get customer ID for this user
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (customerError && customerError.code !== 'PGRST116') {
          console.error("Error fetching customer:", customerError);
          toast({
            title: "שגיאה בטעינת הזמנות",
            description: "לא ניתן לאתר לקוח",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        if (!customerData?.id) {
          console.log("No customer record found for user:", user.id);
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerData.id)
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

        console.log("Orders retrieved:", data);
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

  const fetchOrderDetails = async (orderId: string) => {
    if (!expandedOrders[orderId]) {
      try {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          return;
        }

        console.log("Order items retrieved:", items);

        if (items && items.length > 0) {
          const productIds = [...new Set(items.map(item => item.product_id))];
          
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .in('id', productIds);

          if (productsError) {
            console.error("Error fetching products:", productsError);
          }

          console.log("Products retrieved:", products);

          const enrichedItems = items.map(item => {
            const product = products?.find(p => p.id === item.product_id);
            return {
              ...item,
              product_name: product?.name || 'מוצר לא ידוע'
            };
          });

          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === orderId ? { ...order, items: enrichedItems } : order
            )
          );
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      }
    }
    
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">ממתין לאישור</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">בטיפול</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">הושלם</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">בוטל</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const dayMapping: Record<string, string> = {
    'sunday': 'ראשון',
    'monday': 'שני',
    'tuesday': 'שלישי',
    'wednesday': 'רביעי',
    'thursday': 'חמישי',
    'friday': 'שישי',
    'saturday': 'שבת',
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            חזרה לדף הבית
          </Button>
          <h1 className="text-2xl font-bold">היסטוריית הזמנות</h1>
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
              <Card key={order.id} className="overflow-hidden">
                <div 
                  className="p-4 cursor-pointer" 
                  onClick={() => fetchOrderDetails(order.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      <p className="font-medium">מס' הזמנה: {order.id.substring(0, 8)}</p>
                      <p className="text-sm">{formatCurrency(order.total)}</p>
                    </div>
                    <ChevronDown className={`h-5 w-5 transition-transform ${expandedOrders[order.id] ? 'transform rotate-180' : ''}`} />
                  </div>
                </div>
                
                {expandedOrders[order.id] && (
                  <div className="bg-gray-50 p-4 border-t">
                    <h3 className="font-medium mb-2 text-right">פרטי הזמנה:</h3>
                    
                    {order.items ? (
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between py-1">
                            <div className="text-left">
                              <Badge variant="outline">{item.quantity}×</Badge>
                            </div>
                            <div className="text-right">
                              <p>{item.product_name}</p>
                              <p className="text-xs text-gray-500">יום {dayMapping[item.day_of_week] || item.day_of_week}</p>
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>סה"כ</span>
                          <span>{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">
                        טוען פרטי הזמנה...
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="font-medium text-lg">אין היסטוריית הזמנות</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו הזמנות קודמות במערכת
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

export default OrderHistory;
