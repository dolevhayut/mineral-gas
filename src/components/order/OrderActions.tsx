import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { OrderProduct } from "@/components/order/orderConstants";

interface OrderActionsProps {
  quantities: Record<string, Record<string, number>>;
  products: OrderProduct[];
}

export default function OrderActions({ quantities, products }: OrderActionsProps) {
  const navigate = useNavigate();

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4">
      <Button 
        className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
        onClick={handleOpenSummary}
      >
        המשך לסיכום הזמנה
      </Button>
    </div>
  );
}
