import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import ProductDialog from "@/components/order/ProductDialog";
import OrderHeader from "@/components/order/OrderHeader";
import OrderActions from "@/components/order/OrderActions";
import { quantityOptions, hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { submitOrder } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";
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
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canOrderFresh, setCanOrderFresh] = useState(true);
  const [isFromOrderEdit, setIsFromOrderEdit] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  
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
        // Fetch user's fresh products permission
        if (user && user.id) {
          const { data: userData, error: userError } = await supabase
            .from('custom_users')
            .select('can_order_fresh')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error("Error fetching user permissions:", userError);
            toast({
              title: "שגיאה",
              description: "לא ניתן לטעון הרשאות משתמש",
              variant: "destructive"
            });
          } else {
            setCanOrderFresh(userData?.can_order_fresh ?? true);
          }
        }
        
        // Fetch products based on user permissions
        const query = supabase.from('products').select('*');
        
        // If user can't order fresh products, filter to only show frozen products
        if (!canOrderFresh) {
          query.eq('is_frozen', true);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching products:", error);
          toast({
            title: "שגיאה",
            description: "לא ניתן לטעון את רשימת המוצרים",
            variant: "destructive"
          });
        } else {
          // Convert database products to our Product interface
          const formattedProducts: Product[] = (data || []).map(product => ({
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
        }
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserPermissionsAndProducts();
  }, [user, canOrderFresh]);
  
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
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
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

  const currentProduct = products.find(p => p.id === selectedProduct) || null;

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

        <OrderActions 
          quantities={quantities}
          products={products}
          isFromOrderEdit={isFromOrderEdit}
          onReturnToEdit={handleReturnToEdit}
        />
      </div>
    </MainLayout>
  );
};

export default NewOrder;
