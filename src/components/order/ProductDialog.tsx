import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OrderProduct, MAX_FROZEN_QUANTITY, MAX_FRESH_QUANTITY } from "./orderConstants";
import { useEffect, useState, useMemo } from "react";
import { Package2 as PackageIcon, CircleDot, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  // Get tomorrow's day of week
  const getTomorrowDayOfWeek = (): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return days[tomorrow.getDay()];
  };
  
  const [tomorrowDay, setTomorrowDay] = useState<string>("");
  // Local state for temporary quantities - only saved when clicking "שמור"
  const [tempQuantities, setTempQuantities] = useState<Record<string, number>>({});
  
  useEffect(() => {
    setTomorrowDay(getTomorrowDayOfWeek());
  }, []);

  // Initialize temp quantities when dialog opens
  useEffect(() => {
    if (isOpen && product) {
      const currentQuantities = quantities[product.id] || {};
      setTempQuantities(currentQuantities);
    }
  }, [isOpen, product, quantities]);
  
  // חישוב אפשרויות הכמות בהתאם לסוג המוצר
  const calculatedQuantityOptions = useMemo(() => {
    if (!product) return [0];
    
    // עבור מוצרים קפואים - כמויות קרטונים (1-100)
    if (product.is_frozen) {
      const options = [0];
      for (let i = 1; i <= MAX_FROZEN_QUANTITY; i++) {
        options.push(i);
      }
      return options;
    } 
    // עבור מוצרים טריים - לפי quantity_increment עד MAX_FRESH_QUANTITY
    else {
      const increment = product.quantity_increment || 1;
      const options = [0];
      
      // יצירת אפשרויות עד MAX_FRESH_QUANTITY לפי הקפיצות
      for (let i = 1; i * increment <= MAX_FRESH_QUANTITY; i++) {
        options.push(i * increment);
      }
      
      return options;
    }
  }, [product]);
  
  // Filter days based on the current day when isTomorrowEdit is true
  const daysToShow = useMemo(() => {
    if (!hebrewDays) return [];
    
    // בדיקה אם אנחנו בשעות הלילה המיוחדות (00:00-02:00)
    const now = new Date();
    const currentHour = now.getHours();
    const isNightHours = currentHour >= 0 && currentHour < 2;
    
    // אם זה לא עריכה למחר ולא שעות לילה, הצג את כל הימים
    if (!isTomorrowEdit && !isNightHours) {
      return hebrewDays;
    }
    
    // Get current day index and tomorrow's day index
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const todayIndex = today.getDay();
    
    // Calculate tomorrow's day index
    const tomorrowIndex = (todayIndex + 1) % 7;
    
    // Filter days to show
    return hebrewDays.filter(day => {
      const dayIndex = days.indexOf(day.id);
      
      // אם זה עריכה למחר או שעות לילה - הצג ימים רלוונטיים
      if (isTomorrowEdit || isNightHours) {
        // בשעות הלילה, מציגים גם את היום הנוכחי וגם את מחר
        if (isNightHours) {
          return dayIndex === todayIndex || dayIndex === tomorrowIndex;
        } else {
          // עריכה למחר רגילה - רק מחר
          return dayIndex === tomorrowIndex;
        }
      }
      
      // במקרה רגיל - כל הימים
      return true;
    });
  }, [hebrewDays, isTomorrowEdit]);
  
  if (!product) return null;
  
  // קביעת טקסט יחידת המידה
  const unitText = product.is_frozen ? "קרטון" : "יחידה";
  
  // טקסט כמות בקרטון (רק למוצרים קפואים)
  const packageInfo = product.is_frozen && product.package_amount 
    ? `${product.package_amount} יח׳ בקרטון`
    : null;

  // Handle dialog close - reset temp quantities
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset temp quantities to original values when closing
      if (product) {
        const originalQuantities = quantities[product.id] || {};
        setTempQuantities(originalQuantities);
      }
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-md w-full sm:max-w-md mx-auto p-8 backdrop-blur-md bg-background/90 rounded-xl border-opacity-30">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-center">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-48 object-contain mx-auto mb-6"
          />
          
          {/* הצגת מידע על יחידת המידה */}
          <div className="mb-4 flex justify-center items-center gap-2">
            {packageInfo && (
              <span className="text-sm text-gray-600 font-medium">{packageInfo}</span>
            )}
          </div>
          
          <div className="space-y-4 px-2">
            {daysToShow.map((day) => (
              <div key={day.id} className="flex items-center justify-between border-b pb-3 px-1">
                <span className="font-medium">{day.name}</span>
                <select 
                  onChange={(e) => {
                    const newValue = parseInt(e.target.value) || 0;
                    setTempQuantities(prev => ({ ...prev, [day.id]: newValue }));
                    // Also update parent state immediately
                    onQuantityChange(day.id, newValue.toString());
                  }}
                  value={tempQuantities[day.id]?.toString() || "0"}
                  className="w-28 h-10 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  dir="ltr"
                >
                  {calculatedQuantityOptions.map((qty) => (
                    <option key={qty} value={qty.toString()}>
                      {qty} {qty > 0 && unitText}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
        
        {/* כפתורים למטה */}
        <div className="pt-4 flex justify-between space-x-2 rtl:space-x-reverse bg-gray-50/80 p-3 rounded-lg">
          <Button 
            className="flex-1 mx-2" 
            variant="outline"
            onClick={() => {
              // Reset temp quantities to original values and close
              if (product) {
                const originalQuantities = quantities[product.id] || {};
                setTempQuantities(originalQuantities);
              }
              onClose();
            }}
          >
            חזור
          </Button>
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium mx-2" 
            onClick={() => {
              // Save temp quantities to actual quantities
              if (product) {
                Object.entries(tempQuantities).forEach(([day, value]) => {
                  onQuantityChange(day, value.toString());
                });
              }
              onSave();
            }}
          >
            שמור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
