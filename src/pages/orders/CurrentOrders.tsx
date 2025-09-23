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
import { getOpenOrders, deleteOrderItem } from "@/services/vawoOrderService";
import { OrderLineItem } from "@/integrations/vawo/types";
import { Separator } from "@/components/ui/separator";

// Interface for order display
interface OrderGroup {
  docEntry: number;
  docNum: number;
  dueDate: string;
  items: OrderLineItem[];
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
        
        // Get open orders from VAWO API
        const orderItems = await getOpenOrders();
        console.log("[CurrentOrders] Received order items:", orderItems);
        
        if (!orderItems || orderItems.length === 0) {
          console.log("[CurrentOrders] No order items received");
          setOrders([]);
          setLoading(false);
          return;
        }
        
        console.log("[CurrentOrders] Processing", orderItems.length, "order items");
        
        // Group order items by docEntry (order ID)
        const groupedOrders: Record<number, OrderGroup> = {};
        
        orderItems.forEach(item => {
          console.log("[CurrentOrders] Processing item:", { docEntry: item.docEntry, docNum: item.docNum, description: item.description });
          
          if (!groupedOrders[item.docEntry]) {
            groupedOrders[item.docEntry] = {
              docEntry: item.docEntry,
              docNum: item.docNum,
              dueDate: item.dueDate,
              items: [],
              totalItems: 0
            };
            console.log("[CurrentOrders] Created new order group for docEntry:", item.docEntry);
          }
          
          groupedOrders[item.docEntry].items.push(item);
          groupedOrders[item.docEntry].totalItems += item.quantity;
        });
        
        console.log("[CurrentOrders] Grouped orders:", Object.keys(groupedOrders).map(key => ({
          docEntry: key,
          docNum: groupedOrders[Number(key)].docNum,
          itemCount: groupedOrders[Number(key)].items.length,
          totalItems: groupedOrders[Number(key)].totalItems
        })));
        
        // Sort orders by due date (most recent first)
        const sortedOrders = Object.values(groupedOrders).sort((a, b) => {
          // תיקון הטיפול בתאריכים במיון
          const getDateFromString = (dateString: string) => {
            const fixedDateString = dateString.startsWith('0') ? dateString.substring(1) : dateString;
            const parts = fixedDateString.split('-').map(Number);
            return new Date(parts[0], parts[1] - 1, parts[2]);
          };
          
          const dateA = getDateFromString(a.dueDate);
          const dateB = getDateFromString(b.dueDate);
          return dateB.getTime() - dateA.getTime();
        });
        
        console.log("[CurrentOrders] Final sorted orders:", sortedOrders.map(order => ({
          docEntry: order.docEntry,
          docNum: order.docNum,
          dueDate: order.dueDate,
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

  const handleEditOrder = (docEntry: number) => {
    console.log("[CurrentOrders] Navigating to edit order with docEntry:", docEntry);
    const order = orders.find(o => o.docEntry === docEntry);
    if (order) {
      console.log("[CurrentOrders] Order details:", { docEntry: order.docEntry, docNum: order.docNum, itemCount: order.items.length });
    } else {
      console.log("[CurrentOrders] Order not found in local state");
    }
    navigate(`/orders/edit/${docEntry}`);
  };

  const handleCancelOrder = async (docEntry: number) => {
    // Get the order to cancel
    const order = orders.find(o => o.docEntry === docEntry);
    
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
      
      // Delete each line item
      let success = true;
      for (const item of order.items) {
        const result = await deleteOrderItem(item.docEntry, item.lineNum, item.uom);
        if (!result) {
          success = false;
          break;
        }
      }
      
      if (success) {
        toast({
          title: "ההזמנה בוטלה בהצלחה",
          description: "ההזמנה בוטלה והוסרה מהמערכת",
        });
        
        // Remove the order from the state
        setOrders(prev => prev.filter(o => o.docEntry !== docEntry));
      } else {
        toast({
          title: "שגיאה בביטול ההזמנה",
          description: "לא הצלחנו לבטל את כל פריטי ההזמנה",
          variant: "destructive",
        });
      }
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
      // תיקון לתאריכים עם שנה 02025 במקום 2025
      const fixedDateString = dateString.startsWith('0') ? dateString.substring(1) : dateString;
      const parts = fixedDateString.split('-').map(Number);
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
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
  
  const toggleOrderDetails = (docEntry: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [docEntry]: !prev[docEntry]
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
              variant="default" 
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
                  <Card key={order.docEntry} className="overflow-hidden">
                    <div 
                      className="p-6 cursor-pointer" 
                      onClick={() => toggleOrderDetails(order.docEntry)}
                    >
                      <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">הזמנה מספר: {order.docNum}</h3>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              פעילה
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            תאריך אספקה: {formatDate(order.dueDate)}
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
                              handleEditOrder(order.docEntry);
                            }}
                          >
                            עריכה
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.docEntry);
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrders[order.docEntry] && (
                      <div className="bg-gray-50 p-4 border-t">
                        <h3 className="font-medium mb-2 text-right">פרטי הזמנה:</h3>
                        
                        <div className="space-y-3">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between py-1">
                              <div className="text-left flex items-center">
                                <Badge variant="outline">{item.quantity}×</Badge>
                                {getUnitTypeInfo(item.uom)}
                              </div>
                              <div className="text-right">
                                <p>{item.description}</p>
                                <p className="text-xs text-gray-500">קוד מוצר: {item.itemCode}</p>
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
