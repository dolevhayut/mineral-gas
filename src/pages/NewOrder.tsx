
import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

// Import our components
import ProductsList from "@/components/order/ProductsList";
import ProductDialog from "@/components/order/ProductDialog";
import OrderSummary from "@/components/order/OrderSummary";
import OrderHeader from "@/components/order/OrderHeader";
import OrderActions from "@/components/order/OrderActions";
import { products, quantityOptions, hebrewDays } from "@/components/order/orderConstants";
import { submitOrder } from "@/services/orderService";

const NewOrder = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
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
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const orderId = await submitOrder(user.id, quantities, products, targetDate);
      if (orderId) {
        setIsSummaryOpen(false);
        navigate("/dashboard");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProduct = products.find(p => p.id === selectedProduct) || null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-20">
        <OrderHeader />

        <ProductsList 
          products={products} 
          onSelectProduct={handleProductClick}
          quantities={quantities}
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
          isSubmitting={isSubmitting}
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
