import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { RotateCcwIcon, LoaderIcon } from "lucide-react";

interface ReorderButtonProps {
  orderId: string;
  onReorderSuccess?: () => void;
  className?: string;
}

const ReorderButton = ({ orderId, onReorderSuccess, className }: ReorderButtonProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleReorder = async () => {
    if (!user?.id) {
      toast({
        title: "שגיאה",
        description: "נדרש להתחבר למערכת",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reorder-from-previous`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customer_id: user.id,
          previous_order_id: orderId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה ביצירת הזמנה חוזרת");
      }

      toast({
        title: "הזמנה חוזרת נוצרה בהצלחה",
        description: `נוספו ${data.items_added} פריטים בסכום ${data.total_amount}₪`,
      });

      if (onReorderSuccess) {
        onReorderSuccess();
      }

    } catch (error) {
      console.error("Error creating reorder:", error);
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "אירעה שגיאה ביצירת הזמנה חוזרת",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleReorder}
      disabled={isLoading}
      variant="outline"
      className={`flex items-center gap-2 ${className}`}
    >
      {isLoading ? (
        <LoaderIcon className="h-4 w-4 animate-spin" />
      ) : (
        <RotateCcwIcon className="h-4 w-4" />
      )}
      {isLoading ? "יוצר הזמנה..." : "הזמן שוב"}
    </Button>
  );
};

export default ReorderButton;
