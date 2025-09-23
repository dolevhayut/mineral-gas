import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, ChevronDown, Clock, Package2 as PackageIcon, CircleDot, Edit, PlusCircle, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

// Interface for orders
interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  created_at: string;
  delivery_date: string;
  delivery_address: string;
  special_instructions: string | null;
  order_items: OrderItem[];
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  day_of_week: string;
  products: {
    id: string;
    name: string;
    price: number;
  };
}

const OrderHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isCancellingById, setIsCancellingById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log("Fetching order history for user:", user.name);
        
        // Fetch orders from Supabase
        const { data: ordersData, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (
                id,
                name,
                price
              )
            )
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error fetching orders:", error);
          throw error;
        }
        
        if (!ordersData || ordersData.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching order history:", error);
        toast({
          title: "שגיאה בטעינת היסטוריית הזמנות",
          description: "לא ניתן לטעון את היסטוריית ההזמנות כרגע",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  const getHebrewDayFromDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    return days[date.getDay()];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const getStatusBadge = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">ממתינה</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">בתהליך</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">הושלמה</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">מבוטלת</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">לא ידוע</Badge>;
    }
  };
  
  const isOrderToday = (deliveryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(deliveryDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  };

  const isOrderCancellable = (deliveryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(deliveryDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() >= today.getTime();
  };
  
  const handleEditOrder = (orderId: string) => {
    navigate(`/orders/edit/${orderId}`);
  };



  const isOrderEditable = (deliveryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(deliveryDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate > today;
  };

  const getOrdersByDate = () => {
    const groupedByDate: Record<string, Order[]> = {};
    
    orders.forEach(order => {
      const dateKey = order.delivery_date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(order);
    });
    
    // Sort dates (newest first)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedDates.map(date => ({
      date,
      orders: groupedByDate[date]
    }));
  };

  const handleCancelSingleOrder = async (orderId: string) => {
    if (!window.confirm('לבטל את ההזמנה?')) return;
    setIsCancellingById(prev => ({ ...prev, [orderId]: true }));
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (error) throw error;
      
      toast({ title: 'הזמנה בוטלה', description: `הזמנה #${orderId.slice(0, 8)} בוטלה בהצלחה` });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({ 
        title: 'שגיאה בביטול ההזמנה', 
        description: 'לא ניתן לבטל את ההזמנה כרגע',
        variant: 'destructive'
      });
    } finally {
      setIsCancellingById(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const ordersByDate = getOrdersByDate();

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">יומן הזמנות</h1>
          <Button onClick={() => navigate('/orders/new')} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 ml-1" />
            הזמנה חדשה
          </Button>
        </div>

        

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-8 w-48" />
                <Card className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </Card>
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      הזמנה #{index + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {formatDate(order.delivery_date)} • {getHebrewDayFromDate(order.delivery_date)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.order_items.length} פריטים • {formatCurrency(order.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(order)}
                    {isOrderCancellable(order.delivery_date) && order.status === 'pending' && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelSingleOrder(order.id)}
                        disabled={!!isCancellingById[order.id]}
                      >
                        {isCancellingById[order.id] ? 'מבטל...' : 'ביטול'}
                      </Button>
                    )}
                    {isOrderEditable(order.delivery_date) && order.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditOrder(order.id)}
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        עריכה
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>כתובת:</strong> {order.delivery_address}
                  </p>
                  
                  {order.special_instructions && (
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>הוראות מיוחדות:</strong> {order.special_instructions}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">פריטים:</h4>
                    {order.order_items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <span className="text-sm">{item.products.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{item.quantity}×</span>
                          <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="font-medium text-lg">אין הזמנות</h3>
            <p className="text-muted-foreground mb-4">
              לא נמצאו הזמנות במערכת
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
