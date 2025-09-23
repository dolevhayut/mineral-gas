import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Package2 as PackageIcon, CircleDot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { 
  getOpenOrders, 
  updateOrderItemQuantity, 
  deleteOrderItem,
  submitOrder,
  OrderQuantities,
  cancelOrder
} from "@/services/vawoOrderService";
import { OrderProduct } from "@/components/order/orderConstants";
import { OrderLineItem } from "@/integrations/vawo/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getHebrewDayName } from "@/components/order/utils/orderUtils";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import ProductDialog from "@/components/order/ProductDialog";

interface OrderItemGroup {
  docEntry: number;
  docNum: number;
  dueDate: string;
  items: OrderLineItem[];
}

const EditOrder = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isTomorrowEdit = searchParams.get('edit') === 'tomorrow';
  const isFriday = new Date().getDay() === 5;
  const isSaturdayBlocked = isTomorrowEdit && isFriday;
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState<{ docNum: number, dueDate: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [products, setProducts] = useState<Record<string, { image: string; name: string }>>({});
  // Track pending changes - only submit at the end
  const [pendingChanges, setPendingChanges] = useState<Record<string, { quantity: number; uom: string; originalQuantity: number }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  // Store original quantities to display correctly
  const [originalQuantities, setOriginalQuantities] = useState<Record<string, number>>({});
  // ProductDialog state
  const [selectedProduct, setSelectedProduct] = useState<OrderProduct | null>(null);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [tempQuantities, setTempQuantities] = useState<Record<string, Record<string, number>>>({});
  const [selectedOrderItem, setSelectedOrderItem] = useState<OrderLineItem | null>(null);
  // Cancel order state
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);



  // Get the day of the week from a date string
  const getDayOfWeek = (dateString: string): string => {
    const fixedDateString = dateString.startsWith('0') ? dateString.substring(1) : dateString;
    const parts = fixedDateString.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Get Hebrew day name from date string
  const getHebrewDayFromDate = (dateString: string): string => {
    const dayKey = getDayOfWeek(dateString);
    return getHebrewDayName(dayKey);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
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

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!orderId || !window.confirm('האם אתה בטוח שברצונך לבטל את ההזמנה?')) return;
    
    setIsCancellingOrder(true);
    try {
      const success = await cancelOrder(parseInt(orderId));
      if (success) {
        toast({
          title: "ההזמנה בוטלה בהצלחה",
          description: "ההזמנה בוטלה והוסרה מהמערכת",
        });
        navigate('/orders');
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast({
        title: "שגיאה בביטול ההזמנה",
        description: "אירעה שגיאה בעת ביטול ההזמנה",
        variant: "destructive",
      });
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Load products from database to get images
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('vawo_code, image, name');
        
        if (error) {
          console.error("Error fetching products:", error);
          return;
        }
        
        // Create a mapping from vawo_code to product info
        const productMap: Record<string, { image: string; name: string }> = {};
        data?.forEach(product => {
          if (product.vawo_code) {
            productMap[product.vawo_code] = {
              image: product.image || '',
              name: product.name
            };
          }
        });
        
        setProducts(productMap);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!orderId) {
        return;
      }

      try {
        setIsLoading(true);
        
        // For fetching orders, we need a wider date range to ensure we get all relevant orders
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1); // 1 year back
        
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + 1); // 1 year forward
        
        const orderItems = await getOpenOrders(startDate, endDate);
        
        if (!orderItems || orderItems.length === 0) {
          toast({
            title: "לא נמצאו הזמנות",
            description: "לא נמצאו הזמנות במערכת",
            variant: "destructive"
          });
          navigate('/orders/current');
          return;
        }
        
        // The orderId parameter is the docEntry we want to filter by
        const docEntryNum = Number(orderId);
        
        // Filter by docEntry only (not docNum)
        const matchingItems = orderItems.filter(item => item.docEntry === docEntryNum);
        
        // If no matches, let's see what we have
        if (matchingItems.length === 0) {
          toast({
            title: "לא נמצאה הזמנה",
            description: `ההזמנה המבוקשת (docEntry: ${orderId}) לא נמצאה`,
            variant: "destructive"
          });
          navigate('/orders/current');
          return;
        }
        
        // Fix date format if needed (VAWO API sometimes returns dates in format "02025-03-16")
        const fixDateFormat = (dateString: string): string => {
          const fixed = dateString.startsWith('0') ? dateString.substring(1) : dateString;
          return fixed;
        };
        
        // Extract order info from the first item
        const firstItem = matchingItems[0];
        const orderInfo = {
          docNum: firstItem.docNum,
          dueDate: fixDateFormat(firstItem.dueDate)
        };
        setOrderInfo(orderInfo);
        
        // Fix dates in all items
        const itemsWithFixedDates = matchingItems.map(item => ({
          ...item,
          dueDate: fixDateFormat(item.dueDate)
        }));
        
        // Sort items by itemCode (VAWO code) numerically
        const sortedItems = [...itemsWithFixedDates].sort((a, b) => {
          const aCode = parseInt(a.itemCode) || 0;
          const bCode = parseInt(b.itemCode) || 0;
          
          if (aCode && bCode) {
            return aCode - bCode;
          }
          
          // Fallback to description sort if no valid codes
          return a.description.localeCompare(b.description, 'he');
        });
        
        // Store original quantities
        const originalQtys: Record<string, number> = {};
        sortedItems.forEach(item => {
          const key = `${item.docEntry}-${item.lineNum}`;
          originalQtys[key] = item.quantity;
        });
        setOriginalQuantities(originalQtys);
        
        setOrderItems(sortedItems);
      } catch (error) {
        console.error("[EditOrder] Error fetching order items:", error);
        toast({
          title: "שגיאה בטעינת ההזמנה",
          description: "אירעה שגיאה בטעינת פרטי ההזמנה",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchOrderItems();
    }
  }, [orderId, isAuthenticated, navigate, isTomorrowEdit]);

  useEffect(() => {
    if (isSaturdayBlocked) {
      toast({
        title: "לא ניתן לערוך למחר",
        description: "לא ניתן לעדכן הזמנה לשבת.",
        variant: "destructive"
      });
    }
  }, [isSaturdayBlocked]);



  const handleDeleteItem = async (item: OrderLineItem) => {
    try {
      setIsLoading(true);
      
      const success = await deleteOrderItem(item.docEntry, item.lineNum, item.uom);
      
      if (success) {
        // Remove the item from the local state
        setOrderItems(prev => 
          prev.filter(i => !(i.docEntry === item.docEntry && i.lineNum === item.lineNum))
        );
        
        // If no items left, navigate back to current orders
        if (orderItems.length <= 1) {
          toast({
            title: "כל הפריטים הוסרו",
            description: "ההזמנה בוטלה כיוון שכל הפריטים הוסרו",
          });
          navigate('/orders/current');
        }
      }
    } catch (error) {
      console.error("Error deleting order item:", error);
      toast({
        title: "שגיאה במחיקת הפריט",
        description: "אירעה שגיאה במחיקת הפריט",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItems = () => {
    navigate('/orders/new', {
      state: {
        fromOrderEdit: true,
        orderId: orderId
      }
    });
  };

  // Convert OrderLineItem to OrderProduct for the dialog
  const convertToOrderProduct = (item: OrderLineItem): OrderProduct => {
    const productInfo = products[item.itemCode];
    return {
      id: item.itemCode,
      name: item.description,
      price: 0, // Not needed for editing
      image: productInfo?.image || '',
      sku: item.itemCode,
      is_frozen: item.uom === "קר",
      vawo_code: item.itemCode,
      quantity_increment: 1,
      package_amount: null
    };
  };

  // Handle product card click
  const handleProductClick = (item: OrderLineItem) => {
    const orderProduct = convertToOrderProduct(item);
    setSelectedProduct(orderProduct);
    setSelectedOrderItem(item);
    
    // Initialize temp quantities with current item quantity
    const dayKey = getDayOfWeek(item.dueDate);
    const initialQuantities = {
      [orderProduct.id]: {
        [dayKey]: item.quantity
      }
    };
    
    setTempQuantities(initialQuantities);
    setIsProductDialogOpen(true);
  };

  // Get Hebrew days filtered for the specific order item
  const getFilteredHebrewDays = (item: OrderLineItem) => {
    const dayKey = getDayOfWeek(item.dueDate);
    const dayName = getHebrewDayName(dayKey);
    
    // Return only the specific day for this order item
    return [{ id: dayKey, name: dayName }];
  };

  // Handle quantity change in dialog
  const handleDialogQuantityChange = (day: string, value: string) => {
    if (!selectedProduct) return;
    
    const newValue = parseInt(value) || 0;
    
    setTempQuantities(prev => {
      const updated = {
        ...prev,
        [selectedProduct.id]: {
          ...prev[selectedProduct.id],
          [day]: newValue
        }
      };
      return updated;
    });
  };

  // Handle save from dialog
  const handleDialogSave = () => {
    if (!selectedProduct) return;
    
    // Get the current quantities from the dialog
    const currentQuantities = tempQuantities[selectedProduct.id] || {};
    
    // Find the order item and update its quantity
    const dayQuantity = Object.values(currentQuantities)[0] || 0; // Get the first (and likely only) day quantity
    
    // Find the corresponding order item
    const orderItem = orderItems.find(item => item.itemCode === selectedProduct.id);
    if (orderItem) {
      const changeKey = `${orderItem.docEntry}-${orderItem.lineNum}`;
      const originalQuantity = originalQuantities[changeKey] || orderItem.quantity;
      
      // Save to pending changes
      setPendingChanges(prev => ({
        ...prev,
        [changeKey]: { 
          quantity: dayQuantity, 
          uom: orderItem.uom, 
          originalQuantity 
        }
      }));
      
      // Update local state for immediate UI feedback
      setOrderItems(prev => 
        prev.map(item => 
          item.itemCode === selectedProduct.id
            ? { ...item, quantity: dayQuantity }
            : item
        )
      );
      
      setHasChanges(true);
      
      toast({
        title: "השינוי נשמר זמנית",
        description: `הכמות עודכנה ל-${dayQuantity} ${orderItem.uom === "קר" ? "קרטונים" : "יחידות"}. לחץ על "בצע עדכון" כדי לשלוח את כל השינויים`,
      });
    }
    
    setIsProductDialogOpen(false);
    setSelectedProduct(null);
  };

  // Hebrew days for dialog
  const hebrewDays = [
    { id: 'sunday', name: 'ראשון' },
    { id: 'monday', name: 'שני' },
    { id: 'tuesday', name: 'שלישי' },
    { id: 'wednesday', name: 'רביעי' },
    { id: 'thursday', name: 'חמישי' },
    { id: 'friday', name: 'שישי' },
    { id: 'saturday', name: 'שבת' }
  ];

  // Group items by day
  const itemsByDay = orderItems.reduce((groups: Record<string, OrderLineItem[]>, item) => {
    const day = getDayOfWeek(item.dueDate);
    if (!groups[day]) groups[day] = [];
    groups[day].push(item);
    return groups;
  }, {});

  // Sort days
  const dayOrder: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const sortedDays = Object.keys(itemsByDay).sort(
    (a, b) => (dayOrder[a] || 99) - (dayOrder[b] || 99)
  );

    // New function to handle order submission with pending changes
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "אין פריטים בהזמנה",
        description: "לא ניתן לשלוח הזמנה ריקה",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // First, apply all pending changes via API
      if (Object.keys(pendingChanges).length > 0) {
        for (const [changeKey, change] of Object.entries(pendingChanges)) {
          const [docEntry, lineNum] = changeKey.split('-').map(Number);
          
          try {
            // Calculate target date for tomorrow edits
            let targetDate: Date | undefined = undefined;
            if (isTomorrowEdit && !isFriday) {
              const now = new Date();
              const currentHour = now.getHours();
              const isNightHours = currentHour >= 0 && currentHour < 2;
              
              // בשעות הלילה מחזירים את היום, אחרת מחר
              if (isNightHours) {
                targetDate = new Date(); // היום
              } else {
                targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + 1); // מחר
              }
            }
            
            const success = await updateOrderItemQuantity(docEntry, lineNum, change.quantity, change.uom, targetDate);
            
            if (!success) {
              throw new Error(`Failed to update item ${changeKey}`);
            }
          } catch (error) {
            console.error(`Error updating item ${changeKey}:`, error);
            toast({
              title: "שגיאה בעדכון פריט",
              description: `שגיאה בעדכון פריט ${changeKey}`,
              variant: "destructive"
            });
            return;
          }
        }
        
        // Clear pending changes after successful updates
        setPendingChanges({});
        setHasChanges(false);
        
        toast({
          title: "כל השינויים נשלחו בהצלחה",
          description: "ההזמנה עודכנה במערכת",
        });
        
        // Navigate to external orders page after successful update
        setTimeout(() => {
          window.location.href = 'https://www.orbarbakery.com/orders';
        }, 1000);
      } else {
        toast({
          title: "אין שינויים לעדכון",
          description: "לא בוצעו שינויים בהזמנה",
        });
      }
      
    } catch (error) {
      console.error("Error submitting order updates:", error);
      toast({
        title: "שגיאה בעדכון ההזמנה",
        description: "אירעה שגיאה בעדכון ההזמנה",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }



  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20 pt-6">
        {/* Header */}
        <div className="flex justify-center items-center mb-6 w-full px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">עריכת הזמנה</h1>
            {orderInfo && (
              <div className="mt-2">
                <p className="text-muted-foreground">
                  תאריך אספקה: {formatDate(orderInfo.dueDate)}
                </p>
                <div className="mt-1 bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-2 rounded-lg border border-amber-200">
                  <p className="text-lg font-semibold text-amber-800">
                    יום {getHebrewDayFromDate(orderInfo.dueDate)}
                  </p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="destructive"
                    onClick={handleCancelOrder}
                    disabled={isCancellingOrder}
                  >
                    {isCancellingOrder ? 'מבטל הזמנה...' : 'ביטול הזמנה'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4 mt-8">
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
            <Skeleton className="h-[150px] w-full" />
          </div>
        ) : (
          <>
            {/* Order items display in ProductCard style */}
            <div className="space-y-4">
              {orderItems.map((item, index) => {
                const unitText = item.uom === "קר" ? "קרטון" : "יחידה";
                const changeKey = `${item.docEntry}-${item.lineNum}`;
                const hasPendingChange = pendingChanges[changeKey];
                
                return (
                  <Card 
                    key={`${item.docEntry}-${item.lineNum}`} 
                    className={`overflow-hidden border cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${
                      hasPendingChange ? "border-orange-500 bg-orange-50 shadow-md" : "border-gray-200 hover:border-amber-400 hover:bg-amber-50/30"
                    }`}
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="flex items-stretch min-h-[100px] flex-row-reverse">
                      
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden rounded m-2">
                        {products[item.itemCode]?.image ? (
                          <img 
                            src={products[item.itemCode].image} 
                            alt={item.description} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PackageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 p-4 text-right min-w-0 flex items-center justify-start">
                        <div className="flex items-center gap-4 text-base flex-row-reverse w-full">
                          {/* Quantity */}
                          <span className="font-medium">
                            {hasPendingChange ? pendingChanges[changeKey].quantity : item.quantity}
                            {hasPendingChange && (
                              <span className="text-orange-600 text-sm"> (עודכן)</span>
                            )}
                          </span>
                          
                          {/* Product Name */}
                          <span className="flex-1 text-right">{item.description}</span>
                          
                          {/* Product Code */}
                          <span className="text-gray-600 text-sm">מק"ט: {item.itemCode}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {orderItems.length === 0 && !isLoading && (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <h3 className="font-medium text-lg">אין פריטים בהזמנה</h3>
                <p className="text-muted-foreground mb-4">
                  ההזמנה ריקה או שכל הפריטים הוסרו
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleAddItems}>
                    הוסף פריטים
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Action buttons at the bottom like in NewOrder */}
        {!isLoading && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-md">
            <div className="flex gap-2 max-w-xs mx-auto">
              <Button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2"
                onClick={handleAddItems}
              >
                הוספת מוצרים להזמנה
              </Button>
              {orderItems.length > 0 && (
                <Button 
                  className={`flex-1 text-white font-medium py-2 ${hasChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={isSubmitting || !hasChanges}
                >
                  {isSubmitting ? "שולח..." : hasChanges ? `בצע עדכון (${Object.keys(pendingChanges).length})` : "אין שינויים"}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Submit Order Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>עדכון הזמנה</AlertDialogTitle>
            <AlertDialogDescription>
              {hasChanges ? (
                <>
                  יש לך {Object.keys(pendingChanges).length} שינויים ממתינים. האם ברצונך לשלוח את כל השינויים למערכת?
                  <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                    <strong>שינויים ממתינים:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {Object.entries(pendingChanges).map(([key, change]) => {
                        const item = orderItems.find(i => `${i.docEntry}-${i.lineNum}` === key);
                        return (
                          <li key={key}>
                            {item?.description}: כמות חדשה {change.quantity} {change.uom === "קר" ? "קרטונים" : "יחידות"}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              ) : (
                "אין שינויים ממתינים לעדכון."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleSubmitOrder();
              }}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "שולח..." : "אישור ושליחה"}
            </AlertDialogAction>
          </AlertDialogFooter>
                  </AlertDialogContent>
        </AlertDialog>

        {/* Product Dialog */}
        <ProductDialog
          isOpen={isProductDialogOpen}
          onClose={() => {
            setIsProductDialogOpen(false);
            setSelectedProduct(null);
            setSelectedOrderItem(null);
          }}
          product={selectedProduct}
          quantities={tempQuantities}
          onQuantityChange={handleDialogQuantityChange}
          onSave={handleDialogSave}
          hebrewDays={selectedOrderItem ? getFilteredHebrewDays(selectedOrderItem) : hebrewDays}
          quantityOptions={[]} // Not used in new dialog
          isTomorrowEdit={isTomorrowEdit}
        />
      </MainLayout>
    );
  };
  
  export default EditOrder; 