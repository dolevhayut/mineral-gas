import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { OrderProduct } from "@/components/order/orderConstants";
import DateSelector from "@/components/order/DateSelector";
import EmptyOrderMessage from "@/components/order/EmptyOrderMessage";
import { submitOrder } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

// Type for aggregated day items
interface DayOrderSummary {
  day: string;
  dayHebrew: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  totalQuantity: number;
}

const OrderSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    // Get quantities and products from location state
    if (location.state) {
      const { quantities: stateQuantities, products: stateProducts } = location.state;
      if (stateQuantities) setQuantities(stateQuantities);
      if (stateProducts) setProducts(stateProducts);
    } else {
      // If no state, redirect back to the new order page
      navigate("/orders/new");
    }
  }, [location.state, navigate]);

  // Map of English day names to Hebrew day names
  const dayNameMap: Record<string, string> = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי",
    saturday: "שבת",
  };
  
  // Process quantities to aggregate by day
  const dayOrderSummary: DayOrderSummary[] = [];
  
  Object.entries(quantities).forEach(([productId, dayQuantities]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    Object.entries(dayQuantities).forEach(([day, quantity]) => {
      if (quantity <= 0) return;
      
      // Find existing day entry or create new one
      let dayEntry = dayOrderSummary.find(d => d.day === day);
      
      if (!dayEntry) {
        dayEntry = {
          day,
          dayHebrew: dayNameMap[day] || day,
          products: [],
          totalQuantity: 0
        };
        dayOrderSummary.push(dayEntry);
      }
      
      // Add product to day entry
      dayEntry.products.push({
        productId,
        productName: product.name,
        quantity
      });
      
      // Update total quantity for the day
      dayEntry.totalQuantity += quantity;
    });
  });
  
  // Sort days according to week order
  const dayOrder: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };
  
  dayOrderSummary.sort((a, b) => {
    return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
  });
  
  const hasItems = dayOrderSummary.length > 0;

  const handleBackToOrder = () => {
    navigate("/orders/new");
  };

  const handleSubmitOrder = async () => {
    if (!user || !user.id) {
      console.error("No user ID available for order");
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח הזמנה ללא משתמש מחובר",
        variant: "destructive"
      });
      return;
    }

    if (!targetDate) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך יעד להזמנה",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting order with target date:", targetDate);
      const orderId = await submitOrder(user.id, quantities, products, targetDate);
      if (orderId) {
        toast({
          title: "הזמנה נשלחה בהצלחה",
          description: "ההזמנה שלך נקלטה במערכת",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "אירעה שגיאה בעת שליחת ההזמנה. אנא נסה שנית",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToOrder}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה להזמנה</span>
          </Button>
          <h1 className="text-2xl font-bold">סיכום הזמנה</h1>
        </div>

        <Card className="p-6 shadow-md mb-8">
          {hasItems ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-xl mb-4 text-right">פריטים לפי ימים:</h3>
                {dayOrderSummary.map((daySummary) => (
                  <div key={daySummary.day} className="flex flex-col border-b pb-4 pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">סה"כ: {daySummary.totalQuantity} יח׳</span>
                      <h4 className="font-medium text-lg">יום {daySummary.dayHebrew}</h4>
                    </div>
                    
                    {daySummary.products.map((product, idx) => (
                      <div key={`${daySummary.day}-${product.productId}-${idx}`} className="flex justify-between my-1 pr-4">
                        <span className="text-sm">{product.quantity} יח׳</span>
                        <span className="text-sm text-gray-700">{product.productName}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="font-medium mb-3 text-right">תאריך יעד להזמנה:</h3>
                <DateSelector 
                  targetDate={targetDate} 
                  setTargetDate={setTargetDate} 
                />
                <p className="text-sm text-gray-500 mt-2 text-right">
                  ההזמנה תחזור על עצמה עד לתאריך היעד
                </p>
              </div>
            </div>
          ) : (
            <EmptyOrderMessage />
          )}
        </Card>

        <div className="flex justify-between gap-4 mt-8">
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={handleBackToOrder}
          >
            חזור להזמנה
          </Button>
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600" 
            onClick={handleSubmitOrder}
            disabled={!hasItems || !targetDate || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                מעבד הזמנה...
              </>
            ) : (
              'שלח הזמנה'
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderSummaryPage; 