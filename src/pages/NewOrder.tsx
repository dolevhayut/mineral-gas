
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import ProductDialog from "@/components/order/ProductDialog";
import OrderSummary from "@/components/order/OrderSummary";
import OrderSubmitButton from "@/components/order/OrderSubmitButton";
import { products, quantityOptions, hebrewDays, OrderProduct } from "@/components/order/orderConstants";
import { toast } from "@/hooks/use-toast";

const NewOrder = () => {
  const { isAuthenticated } = useAuth();
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
    // Here would be logic to save the quantities
    console.log("Saved quantities for product:", selectedProduct, quantities[selectedProduct || ""]);
    setIsDialogOpen(false);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const handleOpenSummary = () => {
    // Check if any products have been selected
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

  const handleSubmitOrder = () => {
    console.log("Submitting order with quantities:", quantities);
    setIsSummaryOpen(false);
    // Logic to submit the order would go here
    toast({
      title: "הזמנה נשלחה בהצלחה",
      description: "ההזמנה שלך התקבלה ותטופל בהקדם",
    });
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
