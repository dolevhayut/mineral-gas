import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { OrderProduct } from "@/components/order/orderConstants";
import EmptyOrderMessage from "@/components/order/EmptyOrderMessage";
import { submitOrder } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import OrderSuccessModal from "@/components/order/OrderSuccessModal";
import DaySelector from "@/components/order/DaySelector";

// Type for simple product summary
interface ProductSummary {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

const AdminOrderSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<{
    name: string;
    phone: string;
    address?: string;
    city?: string;
  } | null>(null);
  const [deliveryPreferences, setDeliveryPreferences] = useState<Record<string, {
    dayOfWeek?: number;
    date?: Date;
  }>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string>("");
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [adminSelectedCustomer, setAdminSelectedCustomer] = useState<{id: string, name: string, phone: string, city?: string} | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    // Get quantities and products from location state
    if (location.state) {
      const { 
        quantities: stateQuantities, 
        products: stateProducts,
        deliveryPreferences: stateDeliveryPreferences,
        adminSelectedCustomer: stateAdminCustomer,
        selectedDay: stateSelectedDay,
        targetDate: stateTargetDate,
        paymentConfirmed: statePaymentConfirmed
      } = location.state;
      if (stateQuantities) setQuantities(stateQuantities);
      if (stateProducts) setProducts(stateProducts);
      if (stateDeliveryPreferences) {
        setDeliveryPreferences(stateDeliveryPreferences);
        // If there's a delivery preference with a date, use it as the default target date
        const firstPreference = Object.values(stateDeliveryPreferences).find((pref: any) => pref.date);
        if (firstPreference && (firstPreference as any).date && !stateTargetDate) {
          // Convert to Date if it's not already a Date object
          const date = (firstPreference as any).date instanceof Date 
            ? (firstPreference as any).date 
            : new Date((firstPreference as any).date);
          setTargetDate(date);
          if ((firstPreference as any).dayOfWeek !== undefined) {
            setSelectedDay((firstPreference as any).dayOfWeek);
          }
        }
      }
      if (stateAdminCustomer) setAdminSelectedCustomer(stateAdminCustomer);
      // If selectedDay and targetDate are passed from previous page, use them
      if (stateSelectedDay !== undefined) setSelectedDay(stateSelectedDay);
      if (stateTargetDate) {
        // Convert to Date if it's not already a Date object
        const date = stateTargetDate instanceof Date 
          ? stateTargetDate 
          : new Date(stateTargetDate);
        setTargetDate(date);
      }
      if (statePaymentConfirmed) setPaymentConfirmed(statePaymentConfirmed);
    } else {
      // If no state, redirect back to the admin orders page
      navigate("/admin/orders");
    }
  }, [location.state, navigate]);

  // Fetch customer info
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      // Admin must have selected a customer
      const customerId = adminSelectedCustomer?.id;
      
      if (customerId) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('name, phone, address, city')
            .eq('id', customerId)
            .single();
          
          if (!error && data) {
            setCustomerInfo({
              name: data.name || '',
              phone: data.phone || '',
              address: data.address || '',
              city: data.city || ''
            });
          }
        } catch (error) {
          console.error('Error fetching customer info:', error);
        }
      }
    };
    
    fetchCustomerInfo();
  }, [adminSelectedCustomer]);

  // Process quantities to create simple product summary
  const productSummary: ProductSummary[] = [];
  let totalOrderValue = 0;
  
  Object.entries(quantities).forEach(([productId, quantity]) => {
    if (quantity <= 0) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const totalPrice = quantity * product.price;
    totalOrderValue += totalPrice;
    
    productSummary.push({
      productId,
      productName: product.name,
      quantity,
      price: product.price,
      totalPrice
    });
  });
  
  const hasItems = productSummary.length > 0;

  const handleBackToOrder = () => {
    navigate("/admin/orders/new", {
      state: {
        adminSelectedCustomerId: adminSelectedCustomer?.id
      }
    });
  };

  const handleDaySelect = (dayOfWeek: number, date: Date) => {
    setSelectedDay(dayOfWeek);
    setTargetDate(date);
  };

  const handleSubmitOrder = async () => {
    const customerId = adminSelectedCustomer?.id;
    
    if (!customerId) {
      toast({
        title: "לא נבחר לקוח",
        description: "יש לבחור לקוח כדי לבצע הזמנה",
        variant: "destructive",
      });
      return;
    }

    if (!hasItems) {
      toast({
        title: "אין פריטים בהזמנה",
        description: "לא ניתן לשלוח הזמנה ריקה",
        variant: "destructive",
      });
      return;
    }

    if (!targetDate) {
      toast({
        title: "לא נבחר יום אספקה",
        description: "יש לבחור יום אספקה לפני שליחת ההזמנה",
        variant: "destructive",
      });
      return;
    }

    // If payment is not confirmed, navigate to payment page
    if (!paymentConfirmed) {
      navigate("/admin/orders/payment", {
        state: {
          quantities,
          products,
          targetDate,
          adminSelectedCustomer
        }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a user object for the order submission
      const orderUser = adminSelectedCustomer 
        ? { id: adminSelectedCustomer.id, name: adminSelectedCustomer.name, phone: adminSelectedCustomer.phone } 
        : null;
      
      if (!orderUser) {
        toast({
          title: "שגיאה",
          description: "לא ניתן לזהות את הלקוח",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Submit the order
      const orderResult = await submitOrder(quantities, products, orderUser, targetDate);
      
      if (orderResult) {
        // Show success modal
        setSubmittedOrderId(orderResult.orderId);
        setSubmittedOrderNumber(orderResult.orderNumber || 0);
        setShowSuccessModal(true);
        
        // Navigate to admin orders page after delay
        setTimeout(() => {
          navigate("/admin/orders", { replace: true });
        }, 4000);
      } else {
        toast({
          title: "שגיאה בשליחת ההזמנה",
          description: "לא ניתן ליצור הזמנה",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : "אירעה שגיאה בעת שליחת ההזמנה";
      
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={handleBackToOrder}
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <ArrowRight className="h-4 w-4" />
          <span>חזרה להזמנה</span>
        </Button>
        <h1 className="text-2xl font-bold text-center flex-1">סיכום הזמנה</h1>
        <div className="w-32"></div>
      </div>

      <Card className="p-6 shadow-md">
        {hasItems ? (
          <div className="space-y-6">
            {/* Customer Information */}
            {customerInfo && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-3 text-right">פרטי הלקוח:</h3>
                <div className="space-y-2 text-right">
                  <p><span className="font-medium">שם:</span> {customerInfo.name}</p>
                  <p><span className="font-medium">טלפון:</span> {customerInfo.phone}</p>
                  {customerInfo.address && (
                    <p><span className="font-medium">כתובת:</span> {customerInfo.address}</p>
                  )}
                  {customerInfo.city && (
                    <p><span className="font-medium">עיר:</span> {customerInfo.city}</p>
                  )}
                </div>
              </div>
            )}

            {/* Delivery Preferences for Gas Cylinders */}
            {Object.keys(deliveryPreferences).length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-lg mb-3 text-right">זמן אספקה:</h3>
                <div className="space-y-2 text-right">
                  {Object.entries(deliveryPreferences).map(([productId, preference]) => {
                    const product = products.find(p => p.id === productId);
                    if (!product) return null;
                    
                    return (
                      <div key={productId} className="border-b pb-2 last:border-b-0">
                        <p className="font-medium">{product.name}:</p>
                        {preference.date ? (
                          <p className="text-sm text-gray-600">
                            {format(preference.date, "dd/MM/yyyy", { locale: he })}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600">לא נבחר יום אספקה</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Delivery Day Selection */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-lg mb-3 text-right">יום אספקה:</h3>
              <DaySelector 
                selectedDay={selectedDay}
                onDaySelect={handleDaySelect}
                adminSelectedCustomer={adminSelectedCustomer}
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="font-medium text-xl mb-4 text-right">סיכום הזמנה:</h3>
              
              {productSummary.map((product) => (
                <div key={product.productId} className="flex justify-between items-center py-2 border-b">
                  <div className="text-right">
                    <p className="font-medium">{product.productName}</p>
                    <p className="text-sm text-gray-500">₪{product.price} × {product.quantity}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-green-600">₪{product.totalPrice}</p>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 font-bold text-lg">
                <span className="text-right">סה"כ הזמנה:</span>
                <span className="text-green-600">₪{totalOrderValue}</span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyOrderMessage />
        )}
      </Card>

      <div className="flex justify-center">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg" 
            disabled={isSubmitting || !hasItems || !targetDate}
            onClick={handleSubmitOrder}
            className="min-w-[200px] bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
          >
            {isSubmitting ? (
              <motion.div 
                className="flex items-center"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח הזמנה...
              </motion.div>
            ) : (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ x: 0 }}
                whileHover={{ x: -5 }}
              >
                <Send className="h-4 w-4" />
                שלח הזמנה
              </motion.div>
            )}
          </Button>
        </motion.div>
      </div>
      
      {/* Success Modal */}
      <OrderSuccessModal 
        isOpen={showSuccessModal}
        orderId={submittedOrderId}
        orderNumber={submittedOrderNumber}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/admin/orders", { replace: true });
        }}
      />
    </div>
  );
};

export default AdminOrderSummaryPage;

