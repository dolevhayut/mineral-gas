
import { useState, useEffect } from "react";
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
  targetDate?: Date;
  onTargetDateChange: (date: Date | undefined) => void;
}

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

export default function OrderSummary({ 
  isOpen, 
  onClose, 
  quantities, 
  products, 
  onSubmit,
  isSubmitting = false,
  targetDate,
  onTargetDateChange
}: OrderSummaryProps) {

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
                <h3 className="font-medium text-right">פריטים לפי ימים:</h3>
                {dayOrderSummary.map((daySummary) => (
                  <div key={daySummary.day} className="flex flex-col border-b pb-3 pt-2">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-500">סה"כ: {daySummary.totalQuantity} יח׳</span>
                      <h4 className="font-medium">יום {daySummary.dayHebrew}</h4>
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

              <div>
                <h3 className="font-medium mb-2 text-right">תאריך יעד להזמנה:</h3>
                <DateSelector 
                  targetDate={targetDate} 
                  setTargetDate={onTargetDateChange} 
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
        <div className="pt-4 flex justify-between space-x-2 rtl:space-x-reverse bg-gray-50">
          <Button 
            className="flex-1 bg-green-500 hover:bg-green-600 mx-2" 
            onClick={onSubmit}
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
          <Button 
            className="flex-1 mx-2" 
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
