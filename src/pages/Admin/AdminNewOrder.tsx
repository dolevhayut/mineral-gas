import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import OrderActions from "@/components/order/OrderActions";
import { OrderProduct } from "@/components/order/orderConstants";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the Product interface based on our new schema
interface Product extends OrderProduct {
  is_frozen: boolean;
}

const AdminNewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canOrderFresh, setCanOrderFresh] = useState(true);
  const [isFromOrderEdit, setIsFromOrderEdit] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [deliveryPreferences, setDeliveryPreferences] = useState<Record<string, {
    dayOfWeek?: number;
    date?: Date;
  }>>({});
  const [adminSelectedCustomer, setAdminSelectedCustomer] = useState<{id: string, name: string, phone: string, city?: string} | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  
  useEffect(() => {
    // Check if we're coming from the EditOrder page or Admin
    if (location.state) {
      const { existingQuantities, existingProducts, fromOrderEdit, orderId, adminSelectedCustomerId } = location.state;
      
      if (fromOrderEdit && existingQuantities) {
        setQuantities(existingQuantities);
        setIsFromOrderEdit(true);
        if (orderId) setOrderId(orderId);
      }

      // If admin selected a customer, fetch their details including city
      if (adminSelectedCustomerId) {
        setIsLoadingCustomer(true);
        const fetchCustomerDetails = async () => {
          try {
            const { data, error } = await supabase
              .from('customers')
              .select('id, name, phone, city')
              .eq('id', adminSelectedCustomerId)
              .single();

            if (!error && data) {
              setAdminSelectedCustomer(data);
            } else {
              console.error("Error fetching customer:", error);
              toast.error("שגיאה בטעינת פרטי הלקוח");
            }
          } catch (error) {
            console.error("Error fetching customer:", error);
            toast.error("שגיאה בטעינת פרטי הלקוח");
          } finally {
            setIsLoadingCustomer(false);
          }
        };
        fetchCustomerDetails();
      }
    } else {
      // If no customer selected, redirect back to orders page
      navigate("/admin/orders");
    }
  }, [location.state, navigate]);
  
  useEffect(() => {
    const fetchUserPermissionsAndProducts = async () => {
      setIsLoading(true);
      
      try {
        // Admin must have selected a customer
        if (!adminSelectedCustomer?.id) {
          setIsLoading(false);
          return;
        }
        
        const customerId = adminSelectedCustomer.id;
        setCanOrderFresh(true); // All customers can order all products
        
        // First, fetch the customer's price list
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('price_list_id')
          .eq('id', customerId)
          .single();
        
        if (customerError) {
          console.error("Error fetching customer:", customerError);
        }
        
        const priceListId = customerData?.price_list_id;
        
        // Fetch all products
        const { data: productsData, error: productsError } = await supabase.from('products').select('*');
        
        if (productsError) {
          console.error("Error fetching products:", productsError);
          toast.error("לא ניתן לטעון את רשימת המוצרים");
        } else {
          // Fetch custom prices for this customer's price list
          let customPrices: Record<string, number> = {};
          
          if (priceListId) {
            const { data: priceListItems, error: priceListError } = await supabase
              .from('price_list_items')
              .select('product_id, price')
              .eq('price_list_id', priceListId);
            
            if (!priceListError && priceListItems) {
              customPrices = priceListItems.reduce((acc, item) => {
                acc[item.product_id] = item.price;
                return acc;
              }, {} as Record<string, number>);
            }
          }
          
          // Convert database products to our Product interface
          interface DatabaseProduct {
            id: string;
            name: string;
            description?: string;
            price: number;
            image?: string;
            category?: string;
            cylinder_type?: string;
            is_frozen?: boolean;
            sku?: string;
            available?: boolean;
            featured?: boolean;
            created_at?: string;
            uom?: string;
            package_amount?: number;
            quantity_increment?: number;
          }
          
          const formattedProducts: Product[] = (productsData || []).map((product: DatabaseProduct) => ({
            id: product.id,
            name: product.name,
            description: product.description || '',
            // Use custom price if available, otherwise use default price
            price: customPrices[product.id] !== undefined ? customPrices[product.id] : product.price,
            image: product.image || '/placeholder.png',
            category: product.category || '',
            cylinder_type: product.cylinder_type,
            is_frozen: product.is_frozen || false,
            sku: product.sku || `מק"ט-${product.id}`,
            available: product.available !== false,
            featured: product.featured || false,
            createdAt: product.created_at || new Date().toISOString(),
            uom: product.uom,
            package_amount: product.package_amount,
            quantity_increment: product.quantity_increment
          }));
          
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (adminSelectedCustomer?.id) {
      fetchUserPermissionsAndProducts();
    } else if (!isLoadingCustomer) {
      setIsLoading(false);
    }
  }, [adminSelectedCustomer]);

  const handleProductClick = (productId: string, deliveryPreference?: {
    dayOfWeek?: number;
    date?: Date;
  } | 'increment' | 'decrement') => {
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      const product = products.find(p => p.id === productId);
      
      // Handle increment/decrement actions
      if (deliveryPreference === 'increment') {
        return {
          ...prev,
          [productId]: currentQty + 1
        };
      } else if (deliveryPreference === 'decrement') {
        const newQty = currentQty - 1;
        if (newQty <= 0) {
          if (product) {
            toast.info(`${product.name} הוסר מההזמנה`);
          }
          const newQuantities = { ...prev };
          delete newQuantities[productId];
          // Also remove delivery preference
          setDeliveryPreferences(prevPrefs => {
            const newPrefs = { ...prevPrefs };
            delete newPrefs[productId];
            return newPrefs;
          });
          return newQuantities;
        }
        return {
          ...prev,
          [productId]: newQty
        };
      }
      
      // Handle initial add with delivery preference
      if (currentQty === 0) {
        if (product) {
          toast.success(`${product.name} נוסף להזמנה`);
        }
        return {
          ...prev,
          [productId]: 1
        };
      } else {
        // Default behavior - increment
        return {
          ...prev,
          [productId]: currentQty + 1
        };
      }
    });
    
    // Save delivery preference if provided and it's an object
    if (deliveryPreference && typeof deliveryPreference === 'object') {
      setDeliveryPreferences(prev => ({
        ...prev,
        [productId]: deliveryPreference
      }));
    }
  };
  
  const handleReturnToEdit = () => {
    if (orderId) {
      navigate(`/admin/orders/edit/${orderId}`, {
        state: { 
          updatedQuantities: quantities 
        }
      });
    }
  };

  const handleBackToOrders = () => {
    navigate("/admin/orders");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={handleBackToOrders}
          className="flex items-center gap-2"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה להזמנות
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">יצירת הזמנה חדשה</h1>
        <div className="w-32"></div>
      </div>

      {adminSelectedCustomer && (
        <Alert className="bg-green-50 border-green-200">
          <UserIcon className="h-4 w-4" />
          <AlertTitle>יצירת הזמנה עבור לקוח</AlertTitle>
          <AlertDescription>
            אתה יוצר הזמנה עבור: <strong>{adminSelectedCustomer.name}</strong> ({adminSelectedCustomer.phone})
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="rounded-full h-12 w-12 border-b-2 border-primary animate-spin" />
        </div>
      ) : (
        <>
          <AnimatePresence>
            {!canOrderFresh && (
              <Alert className="bg-amber-100 border-amber-300">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>הגבלה</AlertTitle>
                <AlertDescription>
                  חשבון הלקוח מוגבל להזמנת מוצרים קפואים בלבד
                </AlertDescription>
              </Alert>
            )}
          </AnimatePresence>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <ProductsList 
              products={products} 
              onSelectProduct={handleProductClick}
              quantities={quantities}
              adminSelectedCustomer={adminSelectedCustomer}
            />
          </motion.div>
        </>
      )}

      <OrderActions 
        quantities={quantities}
        products={products}
        isFromOrderEdit={isFromOrderEdit}
        onReturnToEdit={handleReturnToEdit}
        deliveryPreferences={deliveryPreferences}
        adminSelectedCustomer={adminSelectedCustomer}
        isAdmin={true}
      />
    </div>
  );
};

export default AdminNewOrder;

