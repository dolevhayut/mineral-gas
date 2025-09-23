import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderProduct } from "@/components/order/orderConstants";
import { useState } from "react";
import { getOpenOrders, updateOrderItemQuantity } from "@/services/vawoOrderService";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface OrderActionsProps {
  quantities: Record<string, Record<string, number>>;
  products: OrderProduct[];
  isFromOrderEdit?: boolean;
  onReturnToEdit?: () => void;
}

export default function OrderActions({ 
  quantities, 
  products, 
  isFromOrderEdit = false,
  onReturnToEdit
}: OrderActionsProps) {
  const navigate = useNavigate();
  const [isUpdatingForTomorrow, setIsUpdatingForTomorrow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(getTomorrowDate());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // פונקציה להחזרת תאריך של מחר
  function getTomorrowDate(): Date {
    const now = new Date();
    const currentHour = now.getHours();
    const isNightHours = currentHour >= 0 && currentHour < 2;
    
    // בשעות הלילה מחזירים את היום, אחרת מחר
    if (isNightHours) {
      return new Date(); // היום
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow; // מחר
    }
  }

  const handleOpenSummary = () => {
    const hasSelectedProducts = Object.keys(quantities).length > 0;
    if (!hasSelectedProducts) {
      toast({
        title: "אין פריטים בהזמנה",
        description: "אנא בחר לפחות פריט אחד לפני המשך ההזמנה",
        variant: "destructive",
      });
      return;
    }
    
    // Navigate to summary page with state
    navigate("/orders/summary", {
      state: {
        quantities,
        products
      }
    });
  };

  const handleUpdateForTomorrow = async () => {
    if (!selectedDate) {
      toast({
        title: "שגיאה בעדכון",
        description: "נא לבחור תאריך",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. קבלת כל ההזמנות הפעילות
      const orderItems = await getOpenOrders();
      
      if (!orderItems || orderItems.length === 0) {
        toast({
          title: "אין הזמנות פעילות",
          description: "לא נמצאו הזמנות פעילות שניתן להעתיק",
          variant: "destructive",
        });
        setIsLoading(false);
        setIsUpdatingForTomorrow(false);
        return;
      }
      
      // 2. מיון ההזמנות לפי תאריך (החדשה ביותר קודם)
      const sortedItems = [...orderItems].sort((a, b) => 
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      );
      
      // 3. קבלת ההזמנה העדכנית ביותר
      const latestOrderEntry = sortedItems[0].docEntry;
      
      // 4. קיבוץ פריטי ההזמנה העדכנית ביותר
      const latestOrderItems = sortedItems.filter(item => item.docEntry === latestOrderEntry);
      
      // 5. עדכון כל פריט בהזמנה לתאריך החדש
      let successCount = 0;
      for (const item of latestOrderItems) {
        // עדכון הפריט עם אותה כמות אבל תאריך חדש
        const result = await updateOrderItemQuantity(
          item.docEntry,
          item.lineNum,
          item.quantity,
          item.uom,
          selectedDate
        );
        
        if (result) {
          successCount++;
        }
      }
      
      if (successCount === latestOrderItems.length) {
        toast({
          title: "ההזמנה עודכנה בהצלחה",
          description: `כל ${successCount} הפריטים עודכנו לתאריך ${format(selectedDate, "dd/MM/yyyy", { locale: he })}`,
        });
      } else {
        toast({
          title: "עדכון חלקי",
          description: `עודכנו ${successCount} מתוך ${latestOrderItems.length} פריטים`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating order for tomorrow:", error);
      toast({
        title: "שגיאה בעדכון ההזמנה",
        description: "אירעה שגיאה בעת עדכון ההזמנה למחר",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsUpdatingForTomorrow(false);
      
      // לאחר עדכון ההזמנה, נעבור לדף ההזמנות
      navigate('/orders/history');
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4 flex flex-col gap-2">
        {isFromOrderEdit ? (
          <Button 
            className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
            onClick={onReturnToEdit}
          >
            חזור לעריכת ההזמנה עם המוצרים החדשים
          </Button>
        ) : (
          <>
            <Button 
              className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
              onClick={handleOpenSummary}
            >
              המשך לסיכום הזמנה
            </Button>
            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium py-2"
              onClick={() => setIsUpdatingForTomorrow(true)}
            >
              עדכון הזמנה למחר
            </Button>
          </>
        )}
      </div>

      <Dialog open={isUpdatingForTomorrow} onOpenChange={setIsUpdatingForTomorrow}>
        <DialogContent className="sm:max-w-[425px] text-right">
          <DialogHeader>
            <DialogTitle>עדכון הזמנה לתאריך חדש</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              הפעולה תעתיק את ההזמנה האחרונה שלך לתאריך הנבחר.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">בחר תאריך:</label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd/MM/yyyy", { locale: he })
                    ) : (
                      "בחר תאריך"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                    disabled={(date) => {
                      // לא ניתן לבחור תאריכים בעבר
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsUpdatingForTomorrow(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleUpdateForTomorrow}
              disabled={isLoading || !selectedDate}
            >
              {isLoading ? "מעדכן..." : "עדכן הזמנה"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
