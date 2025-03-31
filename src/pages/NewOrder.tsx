import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import ProductDialog from "@/components/order/ProductDialog";
import OrderSummary from "@/components/order/OrderSummary";
import OrderSubmitButton from "@/components/order/OrderSubmitButton";
import { products, quantityOptions, hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const NewOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId);
    setIsDialogOpen(true);
  };

  const handleQuantityChange = (day: string, value: string) => {
    if (!selectedProduct) return;
    
    setQuantities(prev => ({
      ...prev,
      [selectedProduct]: {
        ...(prev[selectedProduct] || {}),
        [day]: parseInt(value)
      }
    }));
  };

  const handleSave = () => {
    console.log("Saved quantities for product:", selectedProduct, quantities[selectedProduct || ""]);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleOpenSummary = () => {
    const hasSelectedProducts = Object.keys(quantities).length > 0;
    if (!hasSelectedProducts) {
      toast({
        title: "אין פריטים בהזמנה",
        description: "אנא בחר לפחות פריט אחד לפני המשך ההזמנה",
        variant: "destructive",
      });
      return;
    }
    setIsSummaryOpen(true);
  };

  const handleSubmitOrder = async () => {
    try {
      if (!user) {
        toast({
          title: "שגיאה",
          description: "יש להתחבר כדי לשלוח הזמנה",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Submitting order for user:", user);
      
      // Check if user ID is valid UUID format before submitting
      if (!user.id || typeof user.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) {
        console.error("Invalid user ID format:", user.id);
        toast({
          title: "שגיאה בשליחת ההזמנה",
          description: "פורמט מזהה משתמש לא תקין",
          variant: "destructive",
        });
        return;
      }
      
      const total = calculateTotal();
      
      // Here you would submit the order to Supabase
      const { data, error } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          status: 'pending',
          total: total
        })
        .select();
      
      if (error) {
        console.error("Error submitting order:", error);
        toast({
          title: "שגיאה בשליחת ההזמנה",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log("Order created:", data);
      const orderId = data?.[0]?.id;
      
      // Add order items
      const orderItems = [];
      for (const [productId, dayQuantities] of Object.entries(quantities)) {
        for (const [day, quantity] of Object.entries(dayQuantities)) {
          if (quantity > 0) {
            orderItems.push({
              order_id: orderId,
              product_id: productId,
              day_of_week: day,
              quantity: quantity,
              price: products.find(p => p.id === productId)?.price || 0
            });
          }
        }
      }
      
      console.log("Inserting order items:", orderItems);
      
      if (orderItems.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error("Error submitting order items:", itemsError);
          toast({
            title: "שגיאה בשליחת פרטי ההזמנה",
            description: itemsError.message,
            variant: "destructive",
          });
          return;
        }
      }
      
      setIsSummaryOpen(false);
      toast({
        title: "הזמנה נשלחה בהצלחה",
        description: "ההזמנה שלך התקבלה ותטופל בהקדם",
      });
      
      // Redirect to dashboard after successful submission
      navigate("/dashboard");
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "שגיאה לא צפויה",
        description: "אירעה שגיאה בעת שליחת ההזמנה",
        variant: "destructive",
      });
    }
  };
  
  const calculateTotal = () => {
    let total = 0;
    for (const [productId, dayQuantities] of Object.entries(quantities)) {
      const productPrice = products.find(p => p.id === productId)?.price || 0;
      for (const quantity of Object.values(dayQuantities)) {
        total += productPrice * quantity;
      }
    }
    return total;
  };

  const currentProduct = products.find(p => p.id === selectedProduct) || null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20">
        <div className="text-center py-4 space-y-1">
          <h1 className="text-xl font-bold">הזמנת מוצרי מאפייה</h1>
          <p className="text-sm text-gray-600">ניתן להזמין עד השעה 00:00</p>
        </div>

        <div className="bg-amber-50 p-3 mb-4 rounded-md border border-amber-300">
          <div className="flex items-start gap-2">
            <p className="text-amber-700 text-sm">
              לחץ על מוצר כדי לבחור כמות רצויה עבור כל יום. בסיום הבחירה לחץ על "המשך לסיכום הזמנה"
            </p>
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
          </div>
        </div>

        <ProductsList 
          products={products} 
          onSelectProduct={handleProductClick}
          quantities={quantities}
        />

        <ProductDialog 
          isOpen={isDialogOpen}
          onClose={handleClose}
          product={currentProduct}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          onSave={handleSave}
          hebrewDays={hebrewDays}
          quantityOptions={quantityOptions}
        />

        <OrderSummary
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          quantities={quantities}
          products={products}
          onSubmit={handleSubmitOrder}
        />

        <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4">
          <Button 
            className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
            onClick={handleOpenSummary}
          >
            המשך לסיכום הזמנה
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewOrder;
