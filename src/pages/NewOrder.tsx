import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import OrderHeader from "@/components/order/OrderHeader";
import OrderActions from "@/components/order/OrderActions";
import { hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { submitOrder } from "@/services/orderService";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the Product interface based on our new schema
interface Product extends OrderProduct {
  is_frozen: boolean;
}

const NewOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canOrderFresh, setCanOrderFresh] = useState(true);
  const [isFromOrderEdit, setIsFromOrderEdit] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [deliveryPreferences, setDeliveryPreferences] = useState<Record<string, {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }>>({});
  const [adminSelectedCustomer, setAdminSelectedCustomer] = useState<{id: string, name: string, phone: string} | null>(null);
  
  useEffect(() => {
    // Check if we're coming from the EditOrder page or Admin
    if (location.state) {
      const { existingQuantities, existingProducts, fromOrderEdit, orderId, adminSelectedCustomerId } = location.state;
      
      if (fromOrderEdit && existingQuantities) {
        setQuantities(existingQuantities);
        setIsFromOrderEdit(true);
        if (orderId) setOrderId(orderId);
      }

      // If admin selected a customer, fetch their details
      if (adminSelectedCustomerId) {
        const fetchCustomerDetails = async () => {
          const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone')
            .eq('id', adminSelectedCustomerId)
            .single();

          if (!error && data) {
            setAdminSelectedCustomer(data);
          }
        };
        fetchCustomerDetails();
      }
    }
  }, [location.state]);
  
  useEffect(() => {
    const fetchUserPermissionsAndProducts = async () => {
      setIsLoading(true);
      
      try {
        // For mineral gas app, all authenticated users can order all products
        if (user && user.id) {
          setCanOrderFresh(true); // All customers can order all products
          
          // First, fetch the customer's price list
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('price_list_id')
            .eq('id', user.id)
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
            
            // Load existing quantities from localStorage if it's a new order
            if (!isFromOrderEdit) {
              const savedQuantities = localStorage.getItem('orderQuantities');
              if (savedQuantities) {
                try {
                  const parsedQuantities = JSON.parse(savedQuantities);
                  // Only apply saved quantities for products that still exist
                  const validQuantities: Record<string, number> = {};
                  Object.keys(parsedQuantities).forEach(productId => {
                    if (formattedProducts.find(p => p.id === productId)) {
                      validQuantities[productId] = parsedQuantities[productId];
                    }
                  });
                  setQuantities(validQuantities);
                } catch (e) {
                  console.error("Error parsing saved quantities:", e);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPermissionsAndProducts();
  }, [user, isFromOrderEdit]);
  
  // Allow access if authenticated OR if admin selected a customer
  if (!isAuthenticated && !adminSelectedCustomer) {
    return <Navigate to="/login" />;
  }

  const handleProductClick = (productId: string, deliveryPreference?: {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
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
  
  const getTomorrowDayOfWeek = (): string => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return days[tomorrow.getDay()];
  };

  
  const handleReturnToEdit = () => {
    if (orderId) {
      navigate(`/orders/edit/${orderId}`, {
        state: { 
          updatedQuantities: quantities 
        }
      });
    }
  };


  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isFromOrderEdit ? (
            <div className="flex justify-between items-center mb-6">
              <motion.div 
                className="ms-auto"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-2xl font-bold">הוספת מוצרים להזמנה</h1>
              </motion.div>
              <motion.div 
                className="me-auto"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button 
                  variant="outline" 
                  onClick={handleReturnToEdit}
                  className="flex items-center gap-2 whitespace-nowrap transition-all hover:scale-105"
                >
                  <ArrowRight className="h-4 w-4" />
                  חזרה לעריכת ההזמנה
                </Button>
              </motion.div>
            </div>
          ) : (
            <OrderHeader />
          )}
        </motion.div>
        
        <AnimatePresence>
          {isFromOrderEdit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="my-4 bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>הוספת מוצרים להזמנה קיימת</AlertTitle>
                <AlertDescription>
                  ניתן לראות את המוצרים הקיימים בהזמנה מסומנים בירוק. לחץ עליהם כדי לשנות את הכמויות.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {adminSelectedCustomer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="my-4 bg-green-50 border-green-200">
                <UserIcon className="h-4 w-4" />
                <AlertTitle>יצירת הזמנה עבור לקוח</AlertTitle>
                <AlertDescription>
                  אתה יוצר הזמנה עבור: <strong>{adminSelectedCustomer.name}</strong> ({adminSelectedCustomer.phone})
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        {isLoading ? (
          <motion.div 
            className="flex justify-center items-center h-48"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="rounded-full h-12 w-12 border-b-2 border-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        ) : (
          <>
            <AnimatePresence>
              {!canOrderFresh && (
                <motion.div 
                  className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded mb-4 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  ⚠️ חשוב לשים לב: חשבונך מוגבל להזמנת מוצרים קפואים בלבד
                </motion.div>
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
        />
      </div>
    </MainLayout>
  );
};

export default NewOrder;
