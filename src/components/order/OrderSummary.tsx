
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { OrderProduct } from "./orderConstants";
import { cn } from "@/lib/utils";

interface OrderSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  quantities: Record<string, Record<string, number>>;
  products: OrderProduct[];
  onSubmit: () => void;
}

export default function OrderSummary({ isOpen, onClose, quantities, products, onSubmit }: OrderSummaryProps) {
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
  // Calculate order summary
  const orderItems = Object.entries(quantities).flatMap(([productId, dayQuantities]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return [];
    
    return Object.entries(dayQuantities).map(([day, quantity]) => {
      if (quantity <= 0) return null;
      return { product, day, quantity };
    }).filter(Boolean);
  });
  
  const hasItems = orderItems.length > 0;

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
                {orderItems.map((item, index) => (
                  <div key={`${item?.product.id}-${item?.day}-${index}`} className="flex justify-between border-b pb-2">
                    <div className="text-left">
                      <span className="font-medium">{item?.quantity}×</span>
                    </div>
                    <div className="text-right">
                      <p>{item?.product.name}</p>
                      <p className="text-sm text-gray-500">יום: {getHebrewDayName(item?.day || "")}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-medium mb-2 text-right">תאריך יעד להזמנה:</h3>
                <div className="w-full flex justify-end">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-right",
                          !targetDate && "text-muted-foreground"
                        )}
                      >
                        {targetDate ? format(targetDate, "dd/MM/yyyy") : "בחר תאריך יעד"}
                        <CalendarIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-right">
                  ההזמנה תחזור על עצמה עד לתאריך היעד
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">לא נבחרו פריטים להזמנה</p>
          )}
        </div>
        <div className="pt-4 flex space-x-2 bg-gray-50 rtl:space-x-reverse">
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600" 
            onClick={onSubmit}
            disabled={!hasItems || !targetDate}
          >
            שלח הזמנה
          </Button>
          <Button 
            className="flex-1" 
            variant="outline"
            onClick={onClose}
          >
            חזור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to convert day ID to Hebrew day name
function getHebrewDayName(dayId: string): string {
  const dayMap: Record<string, string> = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי",
    saturday: "שבת",
  };
  return dayMap[dayId] || dayId;
}
