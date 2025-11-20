import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { AlertCircle, Package2 as PackageIcon, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

// Interface for order display - Updated for Supabase
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
  day_of_week: string;
}

interface OrderGroup {
  id: string;
  order_number: string;
  delivery_date: string;
  payment_status: string;
  delivery_status: string;
  total: number;
  items: OrderItem[];
  totalItems: number;
}

const CurrentOrders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("[CurrentOrders] Fetching current orders for user:", user.name);
        
        // Get open orders from Supabase
        const { data: orderItems, error } = await supabase
          .from('order_items')
          .select(`
            *,
            orders!inner(id, customer_id, payment_status, delivery_status, total, delivery_date, created_at),
            customers!inner(user_id),
            products(name)
          `)
          .eq('customers.user_id', user.id)
          .in('orders.delivery_status', ['pending'])
          .order('orders.created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "שגיאה בטעינת הזמנות",
            description: "לא ניתן לטעון את ההזמנות",
            variant: "destructive",
          });
          return;
        }
        console.log("[CurrentOrders] Received order items:", orderItems);
        
        if (!orderItems || orderItems.length === 0) {
          console.log("[CurrentOrders] No order items received");
          setOrders([]);
          setLoading(false);
          return;
        }
        
        console.log("[CurrentOrders] Processing", orderItems.length, "order items");
        
        // Group order items by order ID
        const groupedOrders: Record<string, OrderGroup> = {};
        
        orderItems.forEach(item => {
          const orderId = (item.orders as any).id;
          const order = item.orders as any;
          
          console.log("[CurrentOrders] Processing item:", { orderId, productName: item.products.name });
          
          if (!groupedOrders[orderId]) {
            groupedOrders[orderId] = {
              id: orderId,
              order_number: orderId.slice(-6), // Use last 6 characters as order number
              delivery_date: order.delivery_date || new Date().toISOString().split('T')[0],
              payment_status: order.payment_status || 'pending',
              delivery_status: order.delivery_status || 'pending',
              total: order.total || 0,
              items: [],
              totalItems: 0
            };
            console.log("[CurrentOrders] Created new order group for orderId:", orderId);
          }
          
          const orderItem: OrderItem = {
            id: item.id,
            product_id: item.product_id,
            product_name: (item.products as any).name || 'Unknown Product',
            quantity: item.quantity,
            price: item.price,
            total: item.quantity * item.price,
            day_of_week: (item as any).day_of_week || ''
          };
          
          groupedOrders[orderId].items.push(orderItem);
          groupedOrders[orderId].totalItems += item.quantity;
        });
        
        console.log("[CurrentOrders] Grouped orders:", Object.keys(groupedOrders).map(key => ({
          orderId: key,
          orderNumber: groupedOrders[key].order_number,
          itemCount: groupedOrders[key].items.length,
          totalItems: groupedOrders[key].totalItems
        })));
        
        // Sort orders by delivery date (most recent first)
        const sortedOrders = Object.values(groupedOrders).sort((a, b) => {
          const dateA = new Date(a.delivery_date);
          const dateB = new Date(b.delivery_date);
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log("[CurrentOrders] Final sorted orders:", sortedOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          delivery_date: order.delivery_date,
          itemCount: order.items.length
        })));
        
        setOrders(sortedOrders);
      } catch (error) {
        console.error("[CurrentOrders] Error fetching orders:", error);
        toast({
          title: "שגיאה בטעינת הזמנות",
          description: "לא ניתן לטעון את ההזמנות כרגע",
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

  const handleEditOrder = (orderId: string) => {
    console.log("[CurrentOrders] Navigating to edit order with orderId:", orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      console.log("[CurrentOrders] Order details:", { id: order.id, order_number: order.order_number, itemCount: order.items.length });
    } else {
      console.log("[CurrentOrders] Order not found in local state");
    }
    navigate(`/orders/edit/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string) => {
    // Get the order to cancel
    const order = orders.find(o => o.id === orderId);
    
    if (!order || !order.items.length) {
      toast({
        title: "שגיאה בביטול הזמנה",
        description: "לא נמצאו פריטים להזמנה זו",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Update order status to cancelled in Supabase
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);
      
      if (updateError) {
        throw updateError;
      }
      
      toast({
        title: "ההזמנה בוטלה בהצלחה",
        description: "ההזמנה בוטלה והוסרה מהמערכת",
      });
      
      // Remove the order from the state
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "שגיאה בביטול ההזמנה",
        description: "אירעה שגיאה בעת ביטול ההזמנה",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // פונקציה להצגת סוג היחידה (קרטון או יחידה)
  const getUnitTypeInfo = (uom: string) => {
    const isFrozen = uom === "קר";
    const unitText = isFrozen ? "קרטון" : "יחידה";
    
    return (
      <Badge variant={isFrozen ? "secondary" : "outline"} className="text-xs mr-2">
        {isFrozen ? (
          <PackageIcon className="h-3 w-3 ml-1" />
        ) : (
          <CircleDot className="h-3 w-3 ml-1" />
        )}
        {unitText}
      </Badge>
    );
  };
  
  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20 pt-6">
        <div className="flex justify-between items-center mb-6 w-full px-4">
          <div className="ms-auto">
            <h1 className="text-2xl font-bold">ההזמנות הפעילות שלי</h1>
          </div>
          <div className="me-auto">
            <Button 
              className="bg-bottle-600 hover:bg-bottle-700 text-white"
              onClick={() => navigate('/orders/new')}
            >
              הזמנה חדשה
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 mt-8">
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        ) : (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground">אין הזמנות פעילות</h3>
                <p className="text-muted-foreground mb-6">
                  אין לך הזמנות פעילות כרגע
                </p>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/orders/new')}
                >
                  צור הזמנה חדשה
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer" 
                      onClick={() => toggleOrderDetails(order.id)}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">הזמנה מספר: {order.order_number}</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              פעילה
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            תאריך אספקה: {formatDate(order.delivery_date)}
                          </p>
                          <p className="text-sm">
                            סה"כ פריטים: {order.totalItems}
                          </p>
                        </div>
                        
                        <div className="flex gap-2 self-end md:self-center mt-4 md:mt-0">
                          <Button 
                            variant="outline" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditOrder(order.id);
                            }}
                          >
                            עריכה
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id);
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrders[order.id] && (
                      <div className="bg-gray-50 p-4 border-t">
                        <h3 className="font-medium mb-2 text-right">פרטי הזמנה:</h3>
                        
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between py-1">
                              <div className="text-left flex items-center">
                                <Badge variant="outline">{item.quantity}×</Badge>
                                <span className="text-xs text-gray-500">יום: {item.day_of_week}</span>
                              </div>
                              <div className="text-right">
                                <p>{item.product_name}</p>
                                <p className="text-xs text-gray-500">קוד מוצר: {item.product_id}</p>
                              </div>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between font-medium">
                            <span>סה"כ כמות</span>
                            <span>{order.totalItems} פריטים</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CurrentOrders;
