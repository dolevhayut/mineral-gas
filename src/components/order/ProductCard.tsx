import { Card } from "@/components/ui/card";
import { OrderProduct } from "./orderConstants";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Input } from "@/components/ui/input";

interface ProductCardProps {
  product: OrderProduct;
  onSelect: (productId: string, deliveryPreference?: {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }) => void;
  isSelected: boolean;
}

export default function ProductCard({ product, onSelect, isSelected }: ProductCardProps) {
  const [deliveryType, setDeliveryType] = useState<'asap' | 'specific'>('asap');
  const [specificDate, setSpecificDate] = useState<Date>();
  const [specificTime, setSpecificTime] = useState<string>('');
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  
  const isGasCylinder = product.category === 'בלוני גז';
  
  const handleProductClick = () => {
    if (isGasCylinder && !isSelected) {
      setShowDeliveryOptions(true);
    } else {
      onSelect(product.id);
    }
  };
  
  const handleConfirmDelivery = () => {
    const deliveryPreference = {
      type: deliveryType,
      ...(deliveryType === 'specific' && {
        date: specificDate,
        time: specificTime
      })
    };
    onSelect(product.id, deliveryPreference);
    setShowDeliveryOptions(false);
  };
  
  return (
    <Card 
      key={product.id}
      className={`overflow-hidden flex items-center border ${isSelected ? "border-green-500" : "border-gray-200"} cursor-pointer hover:bg-gray-50 relative`}
      onClick={handleProductClick}
    >
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-16 h-16 object-cover"
      />
      <div className="flex-1 p-4 text-right">
        <h3 className="font-medium">{product.name}</h3>
        
        <div className="mt-1">
          <span className="text-sm font-semibold text-green-600">₪{product.price}</span>
        </div>
      </div>
      
      {isGasCylinder && showDeliveryOptions && !isSelected && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="text-sm font-medium mb-3">בחר זמן אספקה:</h4>
          
          <Select value={deliveryType} onValueChange={(value: 'asap' | 'specific') => setDeliveryType(value)}>
            <SelectTrigger className="w-full mb-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  כמה שיותר מוקדם
                </div>
              </SelectItem>
              <SelectItem value="specific">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  תאריך ושעה ספציפיים
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {deliveryType === 'specific' && (
            <div className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-right">
                    <Calendar className="ml-2 h-4 w-4" />
                    {specificDate ? format(specificDate, "dd/MM/yyyy", { locale: he }) : "בחר תאריך"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={specificDate}
                    onSelect={setSpecificDate}
                    locale={he}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              
              <Input
                type="time"
                value={specificTime}
                onChange={(e) => setSpecificTime(e.target.value)}
                placeholder="בחר שעה"
                className="w-full"
              />
            </div>
          )}
          
          <Button 
            onClick={handleConfirmDelivery}
            className="w-full mt-3"
            disabled={deliveryType === 'specific' && (!specificDate || !specificTime)}
          >
            הוסף לסל
          </Button>
        </div>
      )}
      
      {isSelected && (
        <div className="absolute top-2 left-2">
          <CheckCircle className="h-6 w-6 text-green-500 fill-white" />
        </div>
      )}
    </Card>
  );
}
