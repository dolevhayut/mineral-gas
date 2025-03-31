
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { OrderProduct } from "./orderConstants";
import OrderSummaryItem from "./OrderSummaryItem";
import DateSelector from "./DateSelector";
import EmptyOrderMessage from "./EmptyOrderMessage";

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
                  item && <OrderSummaryItem 
                    key={`${item.product.id}-${item.day}-${index}`}
                    product={item.product} 
                    day={item.day} 
                    quantity={item.quantity} 
                    index={index} 
                  />
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
