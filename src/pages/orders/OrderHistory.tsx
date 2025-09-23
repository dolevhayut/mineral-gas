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
import { getOpenOrders, cancelOrder } from "@/services/vawoOrderService";
import { OrderLineItem } from "@/integrations/vawo/types";
import { getHebrewDayName } from "@/components/order/utils/orderUtils";

// Interface for grouped orders
interface OrderGroup {
  docEntry: number;
  docNum: number;
  dueDate: string;
  items: OrderLineItem[];
  totalAmount: number;
}

const OrderHistory = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Record<number, boolean>>({});
  

  const [isCancellingByDocEntry, setIsCancellingByDocEntry] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log("Fetching order history for user:", user.name);
        
        // שינוי: לקיחת הזמנות משנה אחורה ועד שנה קדימה
        // Get orders from one year ago until one year in the future
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1); // שנה אחורה
        
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // שנה קדימה
        
        console.log(`Fetching orders from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
        
        const orderItems = await getOpenOrders(startDate, endDate, undefined);
        
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
              totalAmount: 0
            };
          }
          
          groupedOrders[item.docEntry].items.push(item);
          // Calculating a simple total based on quantity
          // This would need to be adjusted if pricing information is available
          groupedOrders[item.docEntry].totalAmount += item.quantity;
        });
        
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
        
        setOrders(sortedOrders);
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

  const toggleOrderDetails = (docEntry: number) => {
    setExpandedOrders(prev => ({
      ...prev,
      [docEntry]: !prev[docEntry]
    }));
  };

  const formatDate = (dateString: string) => {
    try {
      // תיקון לתאריכים עם שנה 02025 במקום 2025
      const fixedDateString = dateString.startsWith('0') ? dateString.substring(1) : dateString;
      const parts = fixedDateString.split('-').map(Number);
      const date = new Date(parts[0], parts[1] - 1, parts[2]);
      
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
    const fixed = dateString.startsWith('0') ? dateString.substring(1) : dateString;
    const parts = fixed.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    const key = days[date.getDay()];
    return getHebrewDayName(key);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const getStatusBadge = (order: OrderGroup) => {
    // Check if all items in the order have the same status
    const statuses = [...new Set(order.items.map(item => item.orderStatus))];
    const orderStatus = statuses.length === 1 ? statuses[0] : 'Mixed';
    
    switch (orderStatus) {
      case 'Open':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">פתוחה</Badge>;
      case 'Closed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">סגורה</Badge>;
      case 'Canceled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">מבוטלת</Badge>;
      case 'Mixed':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">מעורב</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">לא ידוע</Badge>;
    }
  };
  
  const isOrderToday = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fixedDateString = dueDate.startsWith('0') ? dueDate.substring(1) : dueDate;
    const parts = fixedDateString.split('-').map(Number);
    const orderDueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    orderDueDate.setHours(0, 0, 0, 0);
    return orderDueDate.getTime() === today.getTime();
  };

  const isOrderCancellable = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fixedDateString = dueDate.startsWith('0') ? dueDate.substring(1) : dueDate;
    const parts = fixedDateString.split('-').map(Number);
    const orderDueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    orderDueDate.setHours(0, 0, 0, 0);
    return orderDueDate.getTime() >= today.getTime();
  };
  
  // פונקציה להצגת סוג היחידה (קרטון או יחידה)
  const getUnitTypeInfo = (uom: string) => {
    const isFrozen = uom === "קר";
    const unitText = isFrozen ? "קרטון" : "יחידה";
    
    return (
      <Badge variant={isFrozen ? "secondary" : "outline"} className="text-xs ml-2">
        {isFrozen ? (
          <PackageIcon className="h-3 w-3 mr-1" />
        ) : (
          <CircleDot className="h-3 w-3 mr-1" />
        )}
        {unitText}
      </Badge>
    );
  };

  const handleEditOrder = (docEntry: number) => {
    navigate(`/orders/edit/${docEntry}`);
  };



  // פונקציה לבדוק אם הזמנה ניתנת לעריכה (רק אם התאריך הוא בעתיד ולא היום)
  const isOrderEditable = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // איפוס שעה לתחילת היום
    
    // תיקון לתאריכים עם שנה 02025 במקום 2025
    const fixedDateString = dueDate.startsWith('0') ? dueDate.substring(1) : dueDate;
    const parts = fixedDateString.split('-').map(Number);
    const orderDueDate = new Date(parts[0], parts[1] - 1, parts[2]);
    
    // הזמנה ניתנת לעריכה רק אם התאריך הוא בעתיד (לא היום ולא עבר)
    return orderDueDate > today;
  };

  // פונקציה לקיבוץ הזמנות לפי תאריכים
  const getOrdersByDate = () => {
    const groupedByDate: Record<string, OrderGroup[]> = {};
    
    orders.forEach(order => {
      const dateKey = order.dueDate;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(order);
    });
    
    // מיון התאריכים (החדשים ביותר בראש)
    const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
      const getDateFromString = (dateString: string) => {
        const fixedDateString = dateString.startsWith('0') ? dateString.substring(1) : dateString;
        const parts = fixedDateString.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
      };
      
      const dateA = getDateFromString(a);
      const dateB = getDateFromString(b);
      return dateB.getTime() - dateA.getTime();
    });
    
    return sortedDates.map(date => ({
      date,
      orders: groupedByDate[date]
    }));
  };

  const handleCancelSingleOrder = async (docEntry: number) => {
    if (!window.confirm('לבטל את ההזמנה?')) return;
    setIsCancellingByDocEntry(prev => ({ ...prev, [docEntry]: true }));
    try {
      const ok = await cancelOrder(docEntry);
      if (ok) {
        toast({ title: 'הזמנה בוטלה', description: `הזמנה #${docEntry} בוטלה בהצלחה` });
        setOrders(prev => prev.filter(o => o.docEntry !== docEntry));
      }
    } finally {
      setIsCancellingByDocEntry(prev => ({ ...prev, [docEntry]: false }));
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
        ) : ordersByDate.length > 0 ? (
          <div className="space-y-6">
            {ordersByDate.map(({ date, orders: dateOrders }) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const fixedDateString = date.startsWith('0') ? date.substring(1) : date;
              const parts = fixedDateString.split('-').map(Number);
              const orderDate = new Date(parts[0], parts[1] - 1, parts[2]);
              orderDate.setHours(0, 0, 0, 0);
              
              const isToday = orderDate.getTime() === today.getTime();
              const isPast = orderDate < today;
              const isFuture = orderDate > today;
              
              return (
                <div key={date} className="space-y-3">
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                      isToday ? 'bg-blue-100 text-blue-800' :
                      isPast ? 'bg-gray-100 text-gray-700' :
                      'bg-green-100 text-green-800'
                    }`}>
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">
                        {getHebrewDayFromDate(date)} • {formatDate(date)}
                        {isToday && ' (היום)'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {dateOrders.length} הזמנות
                    </Badge>
                  </div>
                  
                  {/* Orders for this date */}
                  <div className="space-y-3 mr-6">
                    {dateOrders.map((order) => (
                      <Card key={order.docEntry} className="overflow-hidden">
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" 
                          onClick={() => toggleOrderDetails(order.docEntry)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">הזמנה #{order.docNum}</p>
                              <p className="text-sm text-gray-600">{order.items.length} פריטים</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(order)}
                              {isOrderCancellable(order.dueDate) && order.items.some(i => i.orderStatus === 'Open') && (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelSingleOrder(order.docEntry);
                                  }}
                                  disabled={!!isCancellingByDocEntry[order.docEntry]}
                                >
                                  {isCancellingByDocEntry[order.docEntry] ? 'מבטל...' : 'ביטול'}
                                </Button>
                              )}
                              {isOrderEditable(order.dueDate) && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditOrder(order.docEntry);
                                  }}
                                >
                                  <Edit className="h-4 w-4 ml-1" />
                                  עריכה
                                </Button>
                              )}
                              <ChevronDown className={`h-5 w-5 transition-transform ${expandedOrders[order.docEntry] ? 'transform rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>
                        
                        {expandedOrders[order.docEntry] && (
                          <div className="bg-gray-50 p-4 border-t">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium">פרטי הזמנה:</h3>
                              {isOrderEditable(order.dueDate) && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleEditOrder(order.docEntry)}
                                >
                                  <PlusCircle className="h-4 w-4 ml-1" />
                                  הוספת פריטים
                                </Button>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                                  <div className="text-right flex-1 ml-4">
                                    <p className="break-words whitespace-pre-wrap leading-relaxed font-medium">{item.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">קוד מוצר: {item.itemCode}</p>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs mt-2 ${
                                        item.orderStatus === 'Open' ? 'bg-blue-50 text-blue-700' :
                                        item.orderStatus === 'Closed' ? 'bg-green-50 text-green-700' :
                                        item.orderStatus === 'Canceled' ? 'bg-red-50 text-red-700' :
                                        'bg-gray-50 text-gray-700'
                                      }`}
                                    >
                                      {item.orderStatus === 'Open' ? 'פתוח' :
                                       item.orderStatus === 'Closed' ? 'סגור' :
                                       item.orderStatus === 'Canceled' ? 'מבוטל' :
                                       item.orderStatus}
                                    </Badge>
                                  </div>
                                  <div className="text-left flex items-center gap-2">
                                    {getUnitTypeInfo(item.uom)}
                                    <Badge variant="outline" className="text-sm font-semibold">
                                      {item.quantity}×
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                              <Separator className="my-3" />
                              <div className="flex justify-between font-medium text-lg">
                                <span>סה"כ: {order.totalAmount} פריטים</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
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
