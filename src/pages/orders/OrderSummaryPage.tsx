import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Send } from "lucide-react";
import { motion } from "framer-motion";
import { OrderProduct } from "@/components/order/orderConstants";
import EmptyOrderMessage from "@/components/order/EmptyOrderMessage";
import { submitOrder } from "@/services/orderService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import OrderSuccessModal from "@/components/order/OrderSuccessModal";

// Type for simple product summary
interface ProductSummary {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

const OrderSummaryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
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
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string>("");
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState<number>(0);

  useEffect(() => {
    // Get quantities and products from location state
    if (location.state) {
      const { 
        quantities: stateQuantities, 
        products: stateProducts,
        deliveryPreferences: stateDeliveryPreferences 
      } = location.state;
      if (stateQuantities) setQuantities(stateQuantities);
      if (stateProducts) setProducts(stateProducts);
      if (stateDeliveryPreferences) setDeliveryPreferences(stateDeliveryPreferences);
    } else {
      // If no state, redirect back to the new order page
      navigate("/orders/new");
    }
  }, [location.state, navigate]);

  // Fetch customer info
  useEffect(() => {
    const fetchCustomerInfo = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('name, phone, address, city')
            .eq('id', user.id)
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
  }, [user]);

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
    navigate("/orders/new");
  };

  const handleSubmitOrder = async () => {
    if (!user) {
      toast({
        title: "אינך מחובר למערכת",
        description: "יש להתחבר כדי לבצע הזמנה",
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

    setIsSubmitting(true);

    try {
      // Submit the order
      const orderResult = await submitOrder(quantities, products, user);
      
      if (orderResult) {
        // Show success modal
        setSubmittedOrderId(orderResult.orderId);
        setSubmittedOrderNumber(orderResult.orderNumber || 0);
        setShowSuccessModal(true);
        
        // Navigate after delay
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
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
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackToOrder}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <ArrowRight className="h-4 w-4" />
            <span>חזרה להזמנה</span>
          </Button>
          <h1 className="text-2xl font-bold text-center flex-1">סיכום הזמנה</h1>
          <div className="w-24"></div> {/* Spacer for balance */}
        </div>

        <Card className="p-6 shadow-md mb-8">
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
                          {preference.type === 'asap' ? (
                            <p className="text-sm text-gray-600">כמה שיותר מוקדם</p>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {preference.date && format(preference.date, "dd/MM/yyyy", { locale: he })}
                              {preference.time && ` בשעה ${preference.time}`}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
              disabled={isSubmitting || !hasItems}
              onClick={handleSubmitOrder}
              className="min-w-[200px] bg-bottle-600 hover:bg-bottle-700 text-white font-medium transition-all"
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
      </div>
      
      {/* Success Modal */}
      <OrderSuccessModal 
        isOpen={showSuccessModal}
        orderId={submittedOrderId}
        orderNumber={submittedOrderNumber}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/dashboard", { replace: true });
        }}
      />
    </MainLayout>
  );
};

export default OrderSummaryPage; 