import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import ProductDialog from "@/components/order/ProductDialog";
import OrderSummary from "@/components/order/OrderSummary";
import OrderHeader from "@/components/order/OrderHeader";
import OrderActions from "@/components/order/OrderActions";
import { quantityOptions, hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { submitOrder } from "@/services/orderService";
import { toast } from "@/hooks/use-toast";

// Define the Product interface based on our new schema
interface Product extends OrderProduct {
  is_frozen: boolean;
}

const NewOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canOrderFresh, setCanOrderFresh] = useState(true);
  
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
    console.log("Saved quantities for product:", selectedProduct, quantities[selectedProduct || ""]);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleOpenSummary = () => {
    setIsSummaryOpen(true);
  };

  const handleSubmitOrder = async () => {
    if (!user || !user.id) {
      console.error("No user ID available for order");
      toast({
        title: "שגיאה",
        description: "לא ניתן לשלוח הזמנה ללא משתמש מחובר",
        variant: "destructive"
      });
      return;
    }

    if (!targetDate) {
      toast({
        title: "שגיאה",
        description: "יש לבחור תאריך יעד להזמנה",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Submitting order with target date:", targetDate);
      const orderId = await submitOrder(user.id, quantities, products, targetDate);
      if (orderId) {
        setIsSummaryOpen(false);
        toast({
          title: "הזמנה נשלחה בהצלחה",
          description: "ההזמנה שלך נקלטה במערכת",
        });
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      toast({
        title: "שגיאה בשליחת ההזמנה",
        description: "אירעה שגיאה בעת שליחת ההזמנה. אנא נסה שנית",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProduct = products.find(p => p.id === selectedProduct) || null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20">
        <OrderHeader />
        
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

        <OrderSummary
          isOpen={isSummaryOpen}
          onClose={() => setIsSummaryOpen(false)}
          quantities={quantities}
          products={products}
          onSubmit={handleSubmitOrder}
          isSubmitting={isSubmitting}
          targetDate={targetDate}
          onTargetDateChange={setTargetDate}
        />

        <OrderActions 
          quantities={quantities}
          onOpenSummary={handleOpenSummary}
        />
      </div>
    </MainLayout>
  );
};

export default NewOrder;
