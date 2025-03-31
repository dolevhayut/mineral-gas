
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Product } from "@/types";

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantities: Record<string, Record<string, number>>;
  onQuantityChange: (day: string, value: string) => void;
  onSave: () => void;
  hebrewDays: Array<{ id: string; name: string }>;
  quantityOptions: number[];
}

export default function ProductDialog({
  isOpen,
  onClose,
  product,
  quantities,
  onQuantityChange,
  onSave,
  hebrewDays,
  quantityOptions
}: ProductDialogProps) {
  if (!product) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full sm:max-w-md mx-4 p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-center">{product.name}</DialogTitle>
          <p className="text-center text-gray-600">{product.sku}</p>
        </DialogHeader>
        <div className="py-6 max-h-[70vh] overflow-y-auto">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-48 object-contain mx-auto mb-6"
          />
          
          <div className="space-y-4">
            {hebrewDays.map((day) => (
              <div key={day.id} className="flex items-center justify-between border-b pb-3">
                <div className="relative w-48">
                  <Select 
                    onValueChange={(value) => onQuantityChange(day.id, value)}
                    value={product && quantities[product.id]?.[day.id]?.toString() || "0"}
                  >
                    <SelectTrigger className="w-full text-right">
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
                <span className="font-medium">{day.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-4 flex space-x-2 bg-gray-50 rtl:space-x-reverse">
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600" 
            onClick={onSave}
          >
            שמור
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
