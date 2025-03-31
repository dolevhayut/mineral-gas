
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { OrderProduct, hebrewDays } from "./orderConstants";
import DateSelector from "./DateSelector";
import EmptyOrderMessage from "./EmptyOrderMessage";

interface OrderSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  quantities: Record<string, Record<string, number>>;
  products: OrderProduct[];
  onSubmit: () => void;
  isSubmitting?: boolean;
}

// Type for aggregated day items
interface DayOrderSummary {
  day: string;
  dayHebrew: string;
  items: {
    productName: string;
    quantity: number;
  }[];
  totalQuantity: number;
}

export default function OrderSummary({ 
  isOpen, 
  onClose, 
  quantities, 
  products, 
  onSubmit,
  isSubmitting = false
}: OrderSummaryProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
  // Aggregate items by day
  const dayOrderSummary: DayOrderSummary[] = [];
  
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
          items: [],
          totalQuantity: 0
        };
        dayOrderSummary.push(dayEntry);
      }
      
      // Add product to day entry
      dayEntry.items.push({
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full sm:max-w-md mx-4 p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-center">סיכום הזמנה</DialogTitle>
        </DialogHeader>
        <div className="py-6 max-h-[70vh] overflow-y-auto">
          {hasItems ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium text-right">פריטים:</h3>
                {dayOrderSummary.map((daySummary, index) => (
                  <div key={daySummary.day} className="flex justify-between border-b pb-3 pt-2">
                    <div className="text-left">
                      <span className="font-medium text-lg text-bakery-600">
                        ×{daySummary.totalQuantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">פיתות אסלית לאכילה במקום</p>
                      <p className="text-sm text-gray-500">יום: {daySummary.dayHebrew}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-medium mb-2 text-right">תאריך יעד להזמנה:</h3>
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
        </div>
        <div className="pt-4 flex space-x-2 bg-gray-50 rtl:space-x-reverse">
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600" 
            onClick={onSubmit}
            disabled={!hasItems || !targetDate || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                מעבד הזמנה...
              </>
            ) : (
              'שלח הזמנה'
            )}
          </Button>
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            חזור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
