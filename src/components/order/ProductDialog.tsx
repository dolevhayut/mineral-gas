import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OrderProduct } from "./orderConstants";
import { useEffect, useState } from "react";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: OrderProduct | null;
  quantities: Record<string, Record<string, number>>;
  onQuantityChange: (day: string, value: string) => void;
  onSave: () => void;
  hebrewDays: Array<{ id: string; name: string }>;
  quantityOptions: number[];
  isTomorrowEdit?: boolean;
}

export default function ProductDialog({
  isOpen,
  onClose,
  product,
  quantities,
  onQuantityChange,
  onSave,
  hebrewDays,
  quantityOptions,
  isTomorrowEdit = false
}: ProductDialogProps) {
  if (!product) return null;
  
  // Get tomorrow's day of week
  const getTomorrowDayOfWeek = (): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return days[tomorrow.getDay()];
  };
  
  const [tomorrowDay, setTomorrowDay] = useState<string>("");
  
  useEffect(() => {
    setTomorrowDay(getTomorrowDayOfWeek());
  }, []);
  
  // Filter hebrewDays to only show tomorrow if it's a tomorrow edit
  // Otherwise, show all days
  const daysToShow = isTomorrowEdit 
    ? hebrewDays.filter(day => day.id === tomorrowDay)
    : hebrewDays;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full sm:max-w-md mx-auto p-8">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-center">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-48 object-contain mx-auto mb-6"
          />
          
          <div className="space-y-4 px-2">
            {daysToShow.map((day) => (
              <div key={day.id} className="flex items-center justify-between border-b pb-3 px-1">
                <span className="font-medium">{day.name}</span>
                <Select 
                  onValueChange={(value) => onQuantityChange(day.id, value)}
                  value={quantities[product.id]?.[day.id]?.toString() || "0"}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="0" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="bg-white">
                    {quantityOptions.map((qty) => (
                      <SelectItem key={qty} value={qty.toString()}>
                        {qty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 flex justify-between space-x-2 rtl:space-x-reverse bg-gray-50 p-2 rounded-b-md">
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600 mx-2" 
            onClick={onSave}
          >
            שמור
          </Button>
          <Button 
            className="flex-1 mx-2" 
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
