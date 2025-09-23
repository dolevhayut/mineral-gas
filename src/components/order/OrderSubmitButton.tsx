import { Button } from "@/components/ui/button";

interface OrderSubmitButtonProps {
  onSubmit: () => void;
  text?: string;
  disabled?: boolean;
}

export default function OrderSubmitButton({ 
  onSubmit, 
  text = "שליחת הזמנה",
  disabled = false 
}: OrderSubmitButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-md">
      <Button 
        className="w-full max-w-xs mx-auto bg-bottle-600 hover:bg-bottle-700 text-white font-medium py-2"
        onClick={onSubmit}
        disabled={disabled}
        size="lg"
      >
        {text}
      </Button>
    </div>
  );
}
