import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProductDialog from "@/components/order/ProductDialog";
import OrderHeader from "@/components/order/OrderHeader";
import { quantityOptions, hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { ArrowRight, CalendarIcon, Edit, PackageIcon } from "lucide-react";
import DateSelector from "@/components/order/DateSelector";

// Define interfaces
interface Product extends OrderProduct {
  is_frozen?: boolean;
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  day_of_week: string;
  quantity: number;
  price: number;
  product?: Product;
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  target_date?: string;
  order_items?: OrderItem[];
}

// Database product type
interface DBProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  is_frozen?: boolean;
  sku?: string;
  available?: boolean;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
}

const EditOrder = () => {
  const { orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);

  // Get tomorrow's date function
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  // Check for URL parameter on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const editParam = searchParams.get('edit');
    
    if (editParam === 'tomorrow') {
      setTargetDate(getTomorrowDate());
    }
  }, [location]);

  // Fetch order details and products
  useEffect(() => {
    const fetchOrderAndProducts = async () => {
      if (!orderId || !user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Get customer ID for this user
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customerError && customerError.code !== 'PGRST116') {
          console.error("Error fetching customer:", customerError);
          toast({
            title: "שגיאה",
            description: "לא ניתן לאתר מידע לקוח",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        if (!customerData?.id) {
          console.log("No customer record found");
          toast({
            title: "שגיאה",
            description: "לא נמצא רשומת לקוח",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        // Fetch the order with its items
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .eq('customer_id', customerData.id)
          .single();
        
        if (orderError) {
          console.error("Error fetching order:", orderError);
          toast({
            title: "שגיאה",
            description: "לא ניתן לטעון את ההזמנה",
            variant: "destructive"
          });
          navigate('/dashboard');
          return;
        }
        
        // Fetch order items
        const { data: orderItemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);
        
        if (itemsError) {
          console.error("Error fetching order items:", itemsError);
          toast({
            title: "שגיאה",
            description: "לא ניתן לטעון את פריטי ההזמנה",
            variant: "destructive"
          });
          return;
        }
        
        // Fetch all products
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*');
        
        if (productsError) {
          console.error("Error fetching products:", productsError);
          toast({
            title: "שגיאה",
            description: "לא ניתן לטעון את רשימת המוצרים",
            variant: "destructive"
          });
          return;
        }
        
        // Process products data
        const formattedProducts: Product[] = (productsData || []).map((product: DBProduct) => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          image: product.image || '/placeholder.png',
          category: product.category || '',
          is_frozen: product.is_frozen || false,
          sku: product.sku || `מק"ט-${product.id}`,
          available: product.available !== false,
          featured: product.featured || false,
          createdAt: product.created_at || new Date().toISOString()
        }));
        
        setProducts(formattedProducts);
        
        // Build quantities object from order items
        const initialQuantities: Record<string, Record<string, number>> = {};
        orderItemsData?.forEach(item => {
          if (!initialQuantities[item.product_id]) {
            initialQuantities[item.product_id] = {};
          }
          initialQuantities[item.product_id][item.day_of_week] = item.quantity;
        });
        
        // Set full order with items
        const fullOrder: Order = {
          ...orderData as Order,
          order_items: orderItemsData
        };
        
        setOrder(fullOrder);
        setQuantities(initialQuantities);
        
        // Set target date if it exists in the order
        // Or if URL parameter wasn't already processed (to prevent overriding)
        if ((orderData as unknown as Order)?.target_date && !targetDate) {
          setTargetDate(new Date((orderData as unknown as Order).target_date as string));
        }
        
      } catch (error) {
        console.error("Unexpected error:", error);
        toast({
          title: "שגיאה לא צפויה",
          description: "אירעה שגיאה בעת טעינת ההזמנה",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderAndProducts();
  }, [orderId, user, navigate, targetDate]);
  
  // Handle opening the dialog for a product
  const handleProductClick = (productId: string) => {
    setSelectedProduct(productId);
    setIsDialogOpen(true);
  };
  
  // Handle quantity changes in the dialog
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
  
  // Save dialog changes
  const handleSave = () => {
    setIsDialogOpen(false);
  };
  
  // Close dialog
  const handleClose = () => {
    setIsDialogOpen(false);
  };
  
  // Update the order in the database
  const handleUpdateOrder = async () => {
    if (!order) return;
    
    if (!targetDate) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך יעד להזמנה",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Calculate the new total
      let total = 0;
      for (const [productId, dayQuantities] of Object.entries(quantities)) {
        const productPrice = products.find(p => p.id === productId)?.price || 0;
        for (const quantity of Object.values(dayQuantities)) {
          total += productPrice * quantity;
        }
      }
      
      // First, update the order with the new total
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ 
          total, 
          updated_at: new Date().toISOString(),
          target_date: targetDate.toISOString().split('T')[0]
        })
        .eq('id', order.id);
      
      if (orderUpdateError) {
        console.error("Error updating order:", orderUpdateError);
        toast({
          title: "שגיאה בעדכון ההזמנה",
          description: orderUpdateError.message,
          variant: "destructive"
        });
        return;
      }
      
      // Delete existing order items
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', order.id);
      
      if (deleteError) {
        console.error("Error deleting order items:", deleteError);
        toast({
          title: "שגיאה בעדכון פריטי ההזמנה",
          description: deleteError.message,
          variant: "destructive"
        });
        return;
      }
      
      // Create new order items from quantities
      const orderItems = [];
      for (const [productId, dayQuantities] of Object.entries(quantities)) {
        for (const [day, quantity] of Object.entries(dayQuantities)) {
          if (quantity > 0) {
            orderItems.push({
              order_id: order.id,
              product_id: productId,
              day_of_week: day,
              quantity: quantity,
              price: products.find(p => p.id === productId)?.price || 0
            });
          }
        }
      }
      
      if (orderItems.length > 0) {
        const { error: insertError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (insertError) {
          console.error("Error inserting order items:", insertError);
          toast({
            title: "שגיאה בעדכון פריטי ההזמנה",
            description: insertError.message,
            variant: "destructive"
          });
          return;
        }
      }
      
      toast({
        title: "ההזמנה עודכנה בהצלחה",
        description: "השינויים שביצעת נשמרו במערכת",
      });
      
      // Navigate back to order list
      navigate('/orders/current');
      
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "שגיאה לא צפויה",
        description: "אירעה שגיאה בעת עדכון ההזמנה",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Get the current product for the dialog
  const currentProduct = products.find(p => p.id === selectedProduct) || null;
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20 pt-6">
        {/* Header with explicit RTL positioning and more spacing */}
        <div className="flex justify-between items-center mb-6 w-full px-4">
          <div className="ms-auto">
            <h1 className="text-2xl font-bold">עריכת הזמנה</h1>
          </div>
          <div className="me-auto">
            <Button 
              variant="outline" 
              onClick={() => navigate('/orders/current')}
              className="flex items-center gap-2 whitespace-nowrap mr-8"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה להזמנות
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-4 mt-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : order ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2 text-center">תאריך יעד להזמנה:</h3>
              <DateSelector 
                targetDate={targetDate} 
                setTargetDate={setTargetDate} 
              />
              {targetDate && (
                <div className="flex justify-center mt-2">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                    <CalendarIcon className="inline-block h-4 w-4 ml-1" />
                    תאריך יעד נוכחי: {formatDate(targetDate.toISOString())}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2 text-center">
                ההזמנה תחזור על עצמה עד לתאריך היעד
              </p>
            </div>
            
            <div className="space-y-4 mb-12">
              {products
                .filter(product => quantities[product.id] && Object.values(quantities[product.id]).some(q => q > 0))
                .map(product => (
                  <div key={product.id} className="relative">
                    <Card className="overflow-hidden mb-2">
                      <div className="p-4 border-b bg-gray-50">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-lg">{product.name}</h3>
                          <span className="text-sm text-gray-500 rtl:ml-2">{product.sku}</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex flex-row-reverse justify-between items-center">
                          <div className="rtl:ml-4">
                            <img 
                              src={product.image || '/placeholder.png'} 
                              alt={product.name} 
                              className="h-20 w-20 object-cover rounded-md shadow-sm"
                            />
                          </div>
                          
                          <div className="text-right flex-1 mx-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rtl:text-right">
                              {Object.entries(quantities[product.id] || {})
                                .filter(([_, qty]) => qty > 0)
                                .map(([day, qty]) => {
                                  // Hebrew day name mapping
                                  const dayTranslation = {
                                    'sunday': 'ראשון',
                                    'monday': 'שני',
                                    'tuesday': 'שלישי',
                                    'wednesday': 'רביעי',
                                    'thursday': 'חמישי',
                                    'friday': 'שישי',
                                    'saturday': 'שבת'
                                  };
                                  
                                  const dayName = dayTranslation[day as keyof typeof dayTranslation] || day;
                                  
                                  return (
                                    <div key={day} className="bg-gray-100 rounded px-2 py-1 inline-block text-sm">
                                      <span className="font-semibold">{dayName}</span>: {qty}
                                    </div>
                                  );
                                })
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                    <div className="flex justify-end mb-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleProductClick(product.id)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4 ml-1" />
                        עריכה
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
            
            <Button
              variant="outline"
              onClick={() => navigate('/orders/new')}
              className="mb-20 flex items-center gap-2"
            >
              <PackageIcon className="h-4 w-4" />
              הוסף מוצרים להזמנה
            </Button>
            
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-between items-center shadow-md">
              <Button
                variant="default"
                size="lg"
                onClick={handleUpdateOrder}
                disabled={isSaving}
                className="flex-1 max-w-xs mx-auto"
              >
                {isSaving ? "מעדכן..." : "שמור שינויים"}
              </Button>
            </div>
            
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
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="font-medium text-lg">ההזמנה לא נמצאה</h3>
            <p className="text-muted-foreground mb-4">
              לא ניתן למצוא את ההזמנה המבוקשת
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              חזרה לדף הבית
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default EditOrder; 