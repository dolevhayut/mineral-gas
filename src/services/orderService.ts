
import { supabase } from "@/integrations/supabase/client";
import { OrderProduct } from "@/components/order/orderConstants";
import { toast } from "@/hooks/use-toast";

export const submitOrder = async (
  userId: string,
  quantities: Record<string, Record<string, number>>,
  products: OrderProduct[]
) => {
  try {
    if (!userId) {
      toast({
        title: "שגיאה",
        description: "יש להתחבר כדי לשלוח הזמנה",
        variant: "destructive",
      });
      return null;
    }
    
    console.log("Submitting order for user:", userId);
    
    // Check if there are items in the order
    const hasItems = Object.values(quantities).some(
      dayQuantities => Object.values(dayQuantities).some(qty => qty > 0)
    );
    
    if (!hasItems) {
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "לא נבחרו מוצרים להזמנה",
        variant: "destructive",
      });
      return null;
    }
    
    const total = calculateTotal(quantities, products);
    
    // Submit the order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id: userId,
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
      return null;
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
        return null;
      }
    }
    
    toast({
      title: "הזמנה נשלחה בהצלחה",
      description: "ההזמנה שלך התקבלה ותטופל בהקדם",
    });
    
    return orderId;
  } catch (error) {
    console.error("Unexpected error:", error);
    toast({
      title: "שגיאה לא צפויה",
      description: "אירעה שגיאה בעת שליחת ההזמנה",
      variant: "destructive",
    });
    return null;
  }
};

export const calculateTotal = (
  quantities: Record<string, Record<string, number>>, 
  products: OrderProduct[]
): number => {
  let total = 0;
  for (const [productId, dayQuantities] of Object.entries(quantities)) {
    const productPrice = products.find(p => p.id === productId)?.price || 0;
    for (const quantity of Object.values(dayQuantities)) {
      total += productPrice * quantity;
    }
  }
  return total;
};
