import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronDown, Package2 as PackageIcon, CircleDot, Edit, PlusCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Interface for order display
interface OrderGroup {
  docEntry: number;
  docNum: number;
  dueDate: string;
  items: OrderLineItem[];
  totalItems: number;
}

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({});
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});
  const [updatingItems, setUpdatingItems] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log("Fetching order history for user:", user.name);
        
        // Get orders from one year ago until one year in the future
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1);
        
        console.log(`Fetching orders from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
        
        const orderItems = await getOpenOrders(startDate, endDate);
        
        if (!orderItems || orderItems.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }
        
        // Group order items by docEntry (order ID)
        const groupedOrders: Record<number, OrderGroup> = {};
        
        orderItems.forEach(item => {
          if (!groupedOrders[item.docEntry]) {
            groupedOrders[item.docEntry] = {
              docEntry: item.docEntry,
              docNum: item.docNum,
              dueDate: item.dueDate,
              items: [],
              totalItems: 0
            };
          }
          
          groupedOrders[item.docEntry].items.push(item);
          groupedOrders[item.docEntry].totalItems += item.quantity;
        });
        
        // Sort orders by due date (most recent first)
        const sortedOrders = Object.values(groupedOrders).sort((a, b) => 
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        );
        
        setOrders(sortedOrders);
        
        // Initialize item quantities
        const quantities: Record<string, number> = {};
        sortedOrders.forEach(order => {
          order.items.forEach(item => {
            const itemKey = `${order.docEntry}-${item.lineNum}`;
            quantities[itemKey] = item.quantity;
          });
        });
        setItemQuantities(quantities);
      } catch (error) {
        console.error("Error fetching orders:", error);
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

  const toggleOrderDetails = (docEntry: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [docEntry]: !prev[docEntry]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      // Fix date format if needed
      const fixedDateString = dateString.startsWith('0') 
        ? dateString.substring(1) 
        : dateString;
        
      const date = new Date(fixedDateString);
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
  
  const handleEditOrder = (docEntry: number) => {
    navigate(`/orders/edit/${docEntry}`);
  };

  const toggleEditItem = (docEntry: number, lineNum: number) => {
    const itemKey = `${docEntry}-${lineNum}`;
    setEditingItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  const handleQuantityChange = (docEntry: number, lineNum: number, value: string) => {
    const itemKey = `${docEntry}-${lineNum}`;
    const numValue = parseInt(value) || 0;
    setItemQuantities(prev => ({
      ...prev,
      [itemKey]: numValue
    }));
  };

  const updateItemQuantity = async (docEntry: number, lineNum: number, uom: string) => {
    const itemKey = `${docEntry}-${lineNum}`;
    const newQuantity = itemQuantities[itemKey];
    
    // Find the original item to compare
    const order = orders.find(o => o.docEntry === docEntry);
    const originalItem = order?.items.find(i => i.lineNum === lineNum);
    
    if (!originalItem || originalItem.quantity === newQuantity) {
      // No change, just exit edit mode
      toggleEditItem(docEntry, lineNum);
      return;
    }
    
    try {
      setUpdatingItems(prev => ({
        ...prev,
        [itemKey]: true
      }));
      
      const success = await updateOrderItemQuantity(docEntry, lineNum, newQuantity, uom);
      
      if (success) {
        // Update the local state
        setOrders(prev => 
          prev.map(order => {
            if (order.docEntry === docEntry) {
              const updatedItems = order.items.map(item => {
                if (item.lineNum === lineNum) {
                  return { ...item, quantity: newQuantity };
                }
                return item;
              });
              
              // Recalculate total
              const newTotal = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
              
              return {
                ...order,
                items: updatedItems,
                totalItems: newTotal
              };
            }
            return order;
          })
        );
        
        toast({
          title: "עודכן בהצלחה",
          description: "כמות הפריט עודכנה בהצלחה",
        });
      }
    } catch (error) {
      console.error("Error updating item quantity:", error);
      toast({
        title: "שגיאה בעדכון הכמות",
        description: "לא ניתן לעדכן את כמות הפריט",
        variant: "destructive",
      });
    } finally {
      setUpdatingItems(prev => ({
        ...prev,
        [itemKey]: false
      }));
      toggleEditItem(docEntry, lineNum);
    }
  };
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 pb-20">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            חזרה לדף הבית
          </Button>
          <h1 className="text-2xl font-bold">ההזמנות שלי</h1>
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
                        <Edit className="h-4 w-4 ml-1" />
                        עריכה
                      </Button>
                      <ChevronDown className={`h-5 w-5 transition-transform ${expandedOrders[order.docEntry] ? 'transform rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>
                
                {expandedOrders[order.docEntry] && (
                  <div className="bg-gray-50 p-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditOrder(order.docEntry)}
                      >
                        <PlusCircle className="h-4 w-4 ml-1" />
                        הוספת פריטים
                      </Button>
                      <h3 className="font-medium">פרטי הזמנה:</h3>
                    </div>
                    
                    <div className="space-y-3">
                      {order.items.map((item, index) => {
                        const itemKey = `${order.docEntry}-${item.lineNum}`;
                        const isEditing = editingItems[itemKey];
                        const isUpdating = updatingItems[itemKey];
                        
                        return (
                          <div key={index} className="flex justify-between py-1">
                            <div className="text-left flex items-center">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    min="0"
                                    className="w-16 h-8 text-center"
                                    value={itemQuantities[itemKey]}
                                    onChange={(e) => handleQuantityChange(order.docEntry, item.lineNum, e.target.value)}
                                  />
                                  <div className="flex gap-1">
                                    <Button 
                                      variant="default" 
                                      size="sm"
                                      disabled={isUpdating}
                                      onClick={() => updateItemQuantity(order.docEntry, item.lineNum, item.uom)}
                                    >
                                      {isUpdating ? "מעדכן..." : "שמור"}
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      disabled={isUpdating}
                                      onClick={() => toggleEditItem(order.docEntry, item.lineNum)}
                                    >
                                      ביטול
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <Badge 
                                    variant="outline" 
                                    className="cursor-pointer" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEditItem(order.docEntry, item.lineNum);
                                    }}
                                  >
                                    {item.quantity}×
                                  </Badge>
                                  {getUnitTypeInfo(item.uom)}
                                </>
                              )}
                            </div>
                            <div className="text-right">
                              <p>{item.description}</p>
                              <p className="text-xs text-gray-500">קוד מוצר: {item.itemCode}</p>
                            </div>
                          </div>
                        );
                      })}
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
        ) : (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">אין הזמנות</h3>
            <p className="text-muted-foreground mb-6">
              אין לך הזמנות במערכת
            </p>
            <Button 
              variant="outline"
              onClick={() => navigate('/orders/new')}
            >
              צור הזמנה חדשה
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Orders;
