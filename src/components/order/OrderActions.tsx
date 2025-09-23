import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderProduct } from "@/components/order/orderConstants";
import { useState } from "react";

interface OrderActionsProps {
  quantities: Record<string, number>;
  products: OrderProduct[];
  isFromOrderEdit?: boolean;
  onReturnToEdit?: () => void;
  deliveryPreferences?: Record<string, {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }>;
}

export default function OrderActions({ 
  quantities, 
  products, 
  isFromOrderEdit = false,
  onReturnToEdit,
  deliveryPreferences = {}
}: OrderActionsProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);


  const handleOpenSummary = () => {
    const hasSelectedProducts = Object.values(quantities).some(qty => qty > 0);
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
        products,
        deliveryPreferences
      }
    });
  };


  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-bottle-600 p-4 flex flex-col gap-2">
        {isFromOrderEdit ? (
          <Button 
            className="w-full bg-white text-bottle-700 hover:bg-gray-100 font-medium py-2"
            onClick={onReturnToEdit}
          >
            חזור לעריכת ההזמנה עם המוצרים החדשים
          </Button>
        ) : (
          <Button 
            className="w-full bg-white text-bottle-700 hover:bg-gray-100 font-medium py-2"
            onClick={handleOpenSummary}
          >
            המשך לסיכום הזמנה
          </Button>
        )}
      </div>

    </>
  );
}
