import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { OrderProduct } from "./orderConstants";
import { Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DaySelector from "./DaySelector";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  product: OrderProduct;
  onSelect: (productId: string, deliveryPreference?: {
    dayOfWeek?: number;
    date?: Date;
  } | 'increment' | 'decrement') => void;
  isSelected: boolean;
  quantity?: number;
  adminSelectedCustomer?: {id: string, name: string, phone: string, city?: string} | null;
}

export default function ProductCard({ product, onSelect, isSelected, quantity = 0, adminSelectedCustomer }: ProductCardProps) {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [isAddAnimating, setIsAddAnimating] = useState(false);
  const [isRemoveAnimating, setIsRemoveAnimating] = useState(false);
  const [customerCity, setCustomerCity] = useState<string | null>(null);
  
  // Fetch customer city (for admin creating order for customer or regular user)
  useEffect(() => {
    const fetchCustomerCity = async () => {
      const customerId = adminSelectedCustomer?.id || user?.id;
      if (!customerId) return;

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('city')
          .eq('id', customerId)
          .single();

        if (!error && data) {
          setCustomerCity(data.city || adminSelectedCustomer?.city || null);
        }
      } catch (error) {
        console.error("Error fetching customer city:", error);
        setCustomerCity(adminSelectedCustomer?.city || null);
      }
    };

    fetchCustomerCity();
  }, [user, adminSelectedCustomer]);

  // Reset animation states when quantity changes to 0
  useEffect(() => {
    if (quantity === 0) {
      setIsAddAnimating(false);
      setIsRemoveAnimating(false);
    }
  }, [quantity]);
  
  const isGasCylinder = product.category === 'בלוני גז';
  
  const handleProductClick = () => {
    if (!isSelected || quantity === 0) {
      // First time adding
      handleAddRemove(true);
    } else {
      // Already in cart - increase quantity
      handleAddRemove(true);
    }
  };
  
  const handleAddRemove = (isAdding: boolean = false) => {
    if (!isSelected || quantity === 0) {
      // Adding to cart - first time
      setIsAddAnimating(true);
      setTimeout(() => setIsAddAnimating(false), 1000);
      
      // For gas cylinders, show dialog
      if (isGasCylinder) {
      setShowDeliveryOptions(true);
      } else {
        onSelect(product.id);
      }
    } else if (isAdding) {
      // Adding more (clicking on card when already selected)
      setIsAddAnimating(true);
      setTimeout(() => setIsAddAnimating(false), 500);
      onSelect(product.id, 'increment');
    } else {
      // Decreasing quantity
      setIsRemoveAnimating(true);
      setTimeout(() => setIsRemoveAnimating(false), 300);
      onSelect(product.id, 'decrement');
    }
  };
  
  const handleDaySelect = (dayOfWeek: number, date: Date) => {
    setSelectedDay(dayOfWeek);
    setSelectedDate(date);
  };

  const handleConfirmDelivery = () => {
    if (selectedDay !== undefined && selectedDate) {
      const deliveryPreference = {
        dayOfWeek: selectedDay,
        date: selectedDate
      };
      onSelect(product.id, deliveryPreference);
      setShowDeliveryOptions(false);
      setIsAddAnimating(true);
      setTimeout(() => setIsAddAnimating(false), 1000);
      // Reset selection
      setSelectedDay(undefined);
      setSelectedDate(undefined);
    }
  };
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
    <Card 
      key={product.id}
        className={`overflow-hidden flex items-center border ${
          isRemoveAnimating && quantity > 0
            ? "border-red-500 bg-red-50" 
            : "border-gray-200 bg-white"
        } hover:shadow-md transition-all relative h-20`}
        style={{
          boxShadow: isRemoveAnimating && quantity > 0
            ? "0 0 0 3px rgba(239, 68, 68, 0.1)"
            : undefined
        }}
      >
        <motion.img 
        src={product.image} 
        alt={product.name} 
          className="w-16 h-16 object-cover cursor-pointer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={handleProductClick}
        />
        <div className="flex-1 p-4 text-right cursor-pointer" onClick={handleProductClick}>
          <motion.h3 
            className="font-medium text-gray-900"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {product.name}
          </motion.h3>
          
          <motion.div 
            className="mt-1 flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-sm font-semibold text-green-600">
              ₪{product.price}
            </span>
            {product.uom && (
              <span className="text-xs text-gray-500">
                {product.uom}
              </span>
            )}
          </motion.div>
        </div>
        
        {/* Add to cart button and quantity */}
        <motion.div 
          className="px-4 flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Add button when selected */}
          <AnimatePresence mode="wait">
            {isSelected && quantity > 0 && (
              <motion.div
                key="add-button"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddRemove(true);
                  }}
                  size="icon"
                  variant="outline"
                  className="rounded-full h-8 w-8 hover:bg-green-50 hover:border-green-500 hover:text-green-600"
                  aria-label="הוסף עוד"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Quantity display with better animation */}
          <AnimatePresence mode="wait">
            {isSelected && quantity > 0 && (
              <motion.div
                key="quantity"
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full shadow-sm border border-gray-200"
              >
                <motion.span 
                  className="text-gray-700 font-bold text-base min-w-[24px] text-center tabular-nums"
                  key={quantity}
                  initial={{ y: -10 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {quantity}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            animate={{
              scale: isAddAnimating 
                ? [1, 1.2, 0.9, 1.1, 1] 
                : isRemoveAnimating 
                  ? [1, 0.8] 
                  : 1,
              rotate: isAddAnimating 
                ? [0, -10, 10, -5, 0] 
                : isRemoveAnimating
                  ? [0, 360]
                  : 0,
            }}
            transition={{ 
              duration: isAddAnimating ? 0.5 : 0.3,
              type: "tween" // Always use tween to avoid spring issues
            }}
          >
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleAddRemove(false);
              }}
              size="icon"
              variant="outline"
              aria-label={isSelected ? "הקטן כמות" : "הוסף לסל"}
              title={isSelected ? "הקטן כמות" : "הוסף לסל"}
              className={`rounded-full transition-all relative overflow-hidden group ${
                !isSelected 
                  ? "hover:bg-green-50 hover:border-green-500 hover:text-green-600" 
                  : "hover:bg-red-50 hover:border-red-500 hover:text-red-600"
              } ${
                isAddAnimating ? "shadow-[0_0_20px_rgba(34,197,94,0.5)]" : ""
              } ${
                isRemoveAnimating ? "shadow-[0_0_20px_rgba(239,68,68,0.5)]" : ""
              }`}
              style={{
                boxShadow: isAddAnimating 
                  ? "0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.4), 0 0 90px rgba(34, 197, 94, 0.2)"
                  : isRemoveAnimating
                    ? "0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.4)"
                    : undefined
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isSelected ? "minus" : "plus"}
                  initial={{ scale: 0, rotate: isSelected ? 180 : 0 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: isSelected ? -180 : 180 }}
                  transition={{ duration: 0.2 }}
                >
                  {isSelected ? (
                    <Minus className="h-5 w-5" />
                  ) : (
                    <Plus className="h-5 w-5" />
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Glow effect overlay */}
              <AnimatePresence>
                {isAddAnimating && (
                  <motion.div
                    className="absolute inset-0 bg-green-400 rounded-full"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ 
                      scale: [0.8, 1.5, 2],
                      opacity: [0.5, 0.3, 0] 
                    }}
                    transition={{ duration: 0.6 }}
                  />
                )}
                {isRemoveAnimating && (
                  <motion.div
                    className="absolute inset-0 bg-red-400 rounded-full"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ 
                      scale: 0,
                      opacity: 0
                    }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.div>
      
      {/* Delivery Day Selection Dialog for Gas Cylinders */}
      <Dialog open={showDeliveryOptions} onOpenChange={(open) => {
        setShowDeliveryOptions(open);
        if (!open) {
          // Reset states when dialog closes
          setSelectedDay(undefined);
          setSelectedDate(undefined);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>בחר יום אספקה עבור {product.name}</DialogTitle>
            <DialogDescription>
              אנא בחר יום אספקה מהימים הזמינים
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <DaySelector 
              selectedDay={selectedDay} 
              onDaySelect={handleDaySelect}
              adminSelectedCustomer={adminSelectedCustomer}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeliveryOptions(false)}
            >
              ביטול
            </Button>
            <Button 
              onClick={handleConfirmDelivery}
              disabled={selectedDay === undefined || !selectedDate}
            >
              הוסף לסל
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </Card>
      
      {/* Tooltip removed - cleaner UX */}
    </motion.div>
  );
}
