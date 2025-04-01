import { supabase } from "@/integrations/supabase/client";
import { OrderProduct } from "@/components/order/orderConstants";
import { toast } from "@/hooks/use-toast";

// Define interface for order data
interface OrderData {
  customer_id: string;
  status: string;
  total: number;
  target_date?: string;
}

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
    
    // Get user data 
    const { data: userData, error: userError } = await supabase
      .from('custom_users')
      .select('name, phone')
      .eq('id', userId)
      .single();
      
    if (userError) {
      console.error("Error fetching user data:", userError);
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "לא ניתן לאתר פרטי משתמש",
        variant: "destructive",
      });
      return null;
    }
    
    // Call server function to create/get customer
    console.log("Calling create-or-get-customer with:", { userId, name: userData.name, phone: userData.phone });
    
    try {
      // First try to get the existing customer directly from the database
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (customerError && customerError.code !== 'PGRST116') {
        console.error("Error checking for existing customer:", customerError);
      }
      
      let customerId;
      
      if (existingCustomer?.id) {
        // Use existing customer
        customerId = existingCustomer.id;
        console.log("Using existing customer ID:", customerId);
      } else {
        // Create new customer
        console.log("No existing customer found, creating new one");
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            name: userData.name,
            phone: userData.phone
          })
          .select('id')
          .single();
          
        if (insertError) {
          console.error("Error creating customer:", insertError);
          toast({
            title: "שגיאה בשליחת ההזמנה",
            description: `לא ניתן ליצור לקוח: ${insertError.message || 'שגיאת שרת'}`,
            variant: "destructive",
          });
          return null;
        }
        
        customerId = newCustomer.id;
        console.log("Created new customer with ID:", customerId);
      }
      
      // Prepare order data
      const orderData: OrderData = {
        customer_id: customerId,
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
    } catch (createCustomerError) {
      console.error("Exception calling create-or-get-customer:", createCustomerError);
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "שגיאה ביצירת לקוח במערכת",
        variant: "destructive",
      });
      return null;
    }
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
