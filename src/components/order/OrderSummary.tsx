import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { OrderProduct, hebrewDays } from "./orderConstants";
import DaySelector from "./DaySelector";
import EmptyOrderMessage from "./EmptyOrderMessage";

interface OrderSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  quantities: Record<string, number>;
  products: OrderProduct[];
  onSubmit: () => void;
  isSubmitting?: boolean;
  selectedDay?: number;
  targetDate?: Date;
  onDaySelect: (dayOfWeek: number, date: Date) => void;
}

// Type for simple product summary
interface ProductSummary {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export default function OrderSummary({ 
  isOpen, 
  onClose, 
  quantities, 
  products, 
  onSubmit,
  isSubmitting = false,
  selectedDay,
  targetDate,
  onDaySelect
}: OrderSummaryProps) {

  // Process quantities to create simple product summary
  const productSummary: ProductSummary[] = [];
  let totalOrderValue = 0;
  
  Object.entries(quantities).forEach(([productId, quantity]) => {
    if (quantity <= 0) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const totalPrice = quantity * product.price;
    totalOrderValue += totalPrice;
    
    productSummary.push({
      productId,
      productName: product.name,
      quantity,
      price: product.price,
      totalPrice
    });
  });
  
  const hasItems = productSummary.length > 0;

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
                <h3 className="font-medium text-right">סיכום הזמנה:</h3>
                
                {productSummary.map((product) => (
                  <div key={product.productId} className="flex justify-between items-center py-2 border-b">
                    <div className="text-right">
                      <p className="font-medium">{product.productName}</p>
                      <p className="text-sm text-gray-500">₪{product.price} × {product.quantity}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-green-600">₪{product.totalPrice}</p>
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 font-bold text-lg">
                  <span className="text-right">סה"כ הזמנה:</span>
                  <span className="text-green-600">₪{totalOrderValue}</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 text-right">יום אספקה:</h3>
                <DaySelector 
                  selectedDay={selectedDay} 
                  onDaySelect={onDaySelect} 
                />
                <p className="text-sm text-gray-500 mt-2 text-right">
                  בחר את היום הרצוי לאספקת ההזמנה
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
            disabled={!hasItems || selectedDay === undefined || !targetDate || isSubmitting}
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
