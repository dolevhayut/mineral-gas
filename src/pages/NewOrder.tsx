import { useState, useEffect } from "react";
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
import { AlertCircle, ArrowRight } from "lucide-react";
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
  
  useEffect(() => {
    // Check if we're coming from the EditOrder page
    if (location.state) {
      const { existingQuantities, existingProducts, fromOrderEdit, orderId } = location.state;
      
      if (fromOrderEdit && existingQuantities) {
        setQuantities(existingQuantities);
        setIsFromOrderEdit(true);
        if (orderId) setOrderId(orderId);
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
          
          // Fetch all products
          const { data, error } = await supabase.from('products').select('*');
          
          if (error) {
            console.error("Error fetching products:", error);
            toast.error("לא ניתן לטעון את רשימת המוצרים");
          } else {
            // Convert database products to our Product interface
            const formattedProducts: Product[] = (data || []).map((product: any) => ({
              id: product.id,
              name: product.name,
              description: product.description || '',
              price: product.price,
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
                  const validQuantities: any = {};
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
  }, [user]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleProductClick = (productId: string, deliveryPreference?: {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }) => {
    // Add product directly to cart
    setQuantities(prev => {
      const currentQty = prev[productId] || 0;
      return {
        ...prev,
        [productId]: currentQty + 1
      };
    });
    
    // Save delivery preference if provided
    if (deliveryPreference) {
      setDeliveryPreferences(prev => ({
        ...prev,
        [productId]: deliveryPreference
      }));
    }
    
    // Show toast message
    const product = products.find(p => p.id === productId);
    if (product) {
      toast.success(`${product.name} נוסף להזמנה`);
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
        {isFromOrderEdit ? (
          <div className="flex justify-between items-center mb-6">
            <div className="ms-auto">
              <h1 className="text-2xl font-bold">הוספת מוצרים להזמנה</h1>
            </div>
            <div className="me-auto">
              <Button 
                variant="outline" 
                onClick={handleReturnToEdit}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <ArrowRight className="h-4 w-4" />
                חזרה לעריכת ההזמנה
              </Button>
            </div>
          </div>
        ) : (
          <OrderHeader />
        )}
        
        {isFromOrderEdit && (
          <Alert className="my-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>הוספת מוצרים להזמנה קיימת</AlertTitle>
            <AlertDescription>
              ניתן לראות את המוצרים הקיימים בהזמנה מסומנים בירוק. לחץ עליהם כדי לשנות את הכמויות.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {!canOrderFresh && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded mb-4 text-center">
                ⚠️ חשוב לשים לב: חשבונך מוגבל להזמנת מוצרים קפואים בלבד
              </div>
            )}
            
            <ProductsList 
              products={products} 
              onSelectProduct={handleProductClick}
              quantities={quantities}
            />
          </>
        )}


        <OrderActions 
          quantities={quantities}
          products={products}
          isFromOrderEdit={isFromOrderEdit}
          onReturnToEdit={handleReturnToEdit}
          deliveryPreferences={deliveryPreferences}
        />
      </div>
    </MainLayout>
  );
};

export default NewOrder;
