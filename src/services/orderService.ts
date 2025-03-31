
import { supabase } from "@/integrations/supabase/client";
import { OrderProduct } from "@/components/order/orderConstants";
import { toast } from "@/hooks/use-toast";

export const submitOrder = async (
  userId: string,
  quantities: Record<string, Record<string, number>>,
  products: OrderProduct[],
  targetDate?: Date
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
    
    // First fetch the customer ID using the user ID
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    let customerId: string | undefined;
    
    if (customerError) {
      console.error("Error fetching customer:", customerError);
      
      // Create a new customer if one doesn't exist
      if (customerError.code === "PGRST116") {
        const { data: userData } = await supabase
          .from('custom_users')
          .select('name, phone')
          .eq('id', userId)
          .single();
          
        if (userData) {
          const { data: newCustomer, error: createCustomerError } = await supabase
            .from('customers')
            .insert({
              user_id: userId,
              name: userData.name,
              phone: userData.phone
            })
            .select();
            
          if (createCustomerError) {
            console.error("Error creating customer:", createCustomerError);
            toast({
              title: "שגיאה בשליחת ההזמנה",
              description: "לא ניתן ליצור לקוח חדש",
              variant: "destructive",
            });
            return null;
          }
          
          customerId = newCustomer?.[0]?.id;
        }
      } else {
        toast({
          title: "שגיאה בשליחת ההזמנה",
          description: customerError.message,
          variant: "destructive",
        });
        return null;
      }
    } else {
      customerId = customerData?.id;
    }
    
    // Use either the found customer ID or fallback to the user ID
    const finalCustomerId = customerId || userId;
    
    // Prepare order data
    const orderData: any = {
      customer_id: finalCustomerId,
      status: 'pending',
      total: total
    };
    
    // Add target date if provided
    if (targetDate) {
      orderData.target_date = targetDate.toISOString().split('T')[0];
    }
    
    // Submit the order to Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert(orderData)
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
