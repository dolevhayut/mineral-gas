
import { Button } from "@/components/ui/button";

interface OrderSubmitButtonProps {
  onSubmit: () => void;
}

export default function OrderSubmitButton({ onSubmit }: OrderSubmitButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4">
      <Button 
        className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
        onClick={onSubmit}
      >
        שליחת הזמנה
      </Button>
    </div>
  );
}
