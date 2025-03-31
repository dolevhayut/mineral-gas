
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";

// Sample products for now - in real app would come from Supabase
const products = [
  {
    id: "110",
    name: "פיתה אסלית פלאפל במקאה",
    price: 15,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-110"
  },
  {
    id: "111",
    name: "פיתה אסלית שווארמה במקאה",
    price: 18,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-111"
  },
  {
    id: "112",
    name: "פיתה ביס (פרוסה) במקאה",
    price: 12,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-112"
  },
  {
    id: "113",
    name: "פיתה אסלית קמח מלא במקאה",
    price: 16,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-113"
  },
  {
    id: "13",
    name: "לאפות",
    price: 20,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-13"
  },
  {
    id: "114",
    name: "בגט",
    price: 10,
    image: "https://placekitten.com/200/150",
    sku: "מק\"ט-114"
  }
];

const NewOrder = () => {
  const { isAuthenticated } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmitOrder = () => {
    // Here would be the logic to submit the order to Supabase
    console.log("Order submitted with products:", selectedProducts);
  };

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 pb-20">
        <div className="text-center py-4 space-y-1">
          <img 
            src="/lovable-uploads/512529e2-f308-401e-b298-51a1e8c9ffc2.png"
            alt="לוגו"
            className="mx-auto w-24 h-24"
          />
          <h1 className="text-xl font-bold">הזמנה חדשה</h1>
          <p className="text-sm text-gray-600">ניתן להזמין עד השעה 00:00</p>
        </div>

        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md py-3 mb-4"
        >
          צפייה בהיסטוריה
        </Button>

        <div className="bg-amber-50 p-3 mb-4 rounded-md border border-amber-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
            <p className="text-amber-700 text-sm">
              יש ללחוץ על פריט כדי להוסיפו להזמנה, ולאחר מכן לבחור כמות רצויה. בסוף התהליך יש ללחוץ שמור עבור כל פריט ואז שליחת ההזמנה בתחתית המסך
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {products.map((product) => (
            <Card 
              key={product.id}
              className={`overflow-hidden flex items-center border ${
                selectedProducts.includes(product.id) ? "border-bakery-500" : "border-gray-200"
              }`}
              onClick={() => toggleProduct(product.id)}
            >
              <div className="flex-1 p-4 text-right">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.sku}</p>
              </div>
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-24 h-24 object-cover"
              />
            </Card>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4">
          <Button 
            className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
            onClick={handleSubmitOrder}
          >
            שליחת הזמנה
          </Button>
        </div>
      </div>
    </MainLayoutWithFooter>
  );
};

export default NewOrder;
