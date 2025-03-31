
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronDown } from "lucide-react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Sample products for now - in real app would come from Supabase
const products = [
  {
    id: "110",
    name: "פיתה אסלית פלאפל במקאה",
    price: 15,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-110"
  },
  {
    id: "111",
    name: "פיתה אסלית שווארמה במקאה",
    price: 18,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-111"
  },
  {
    id: "112",
    name: "פיתה ביס (פרוסה) במקאה",
    price: 12,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-112"
  },
  {
    id: "113",
    name: "פיתה אסלית קמח מלא במקאה",
    price: 16,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-113"
  },
  {
    id: "13",
    name: "לאפות",
    price: 20,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-13"
  },
  {
    id: "114",
    name: "בגט",
    price: 10,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-114"
  }
];

const quantityOptions = [0, 50, 100, 150, 200, 250, 300];

const hebrewDays = [
  { id: "sunday", name: "ראשון" },
  { id: "monday", name: "שני" },
  { id: "tuesday", name: "שלישי" },
  { id: "wednesday", name: "רביעי" },
  { id: "thursday", name: "חמישי" },
  { id: "friday", name: "שישי" }
];

const NewOrder = () => {
  const { isAuthenticated } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  return (
    <MainLayout>
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
              className="overflow-hidden flex items-center border border-gray-200 cursor-pointer"
              onClick={() => handleProductClick(product.id)}
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md w-full sm:max-w-md mx-4 p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-center">{currentProduct?.name}</DialogTitle>
              <p className="text-center text-gray-600">{currentProduct?.sku}</p>
            </DialogHeader>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <img 
                src={currentProduct?.image} 
                alt={currentProduct?.name} 
                className="w-full h-48 object-contain mx-auto mb-6"
              />
              
              <div className="space-y-4">
                {hebrewDays.map((day) => (
                  <div key={day.id} className="flex items-center justify-between border-b pb-3">
                    <div className="relative w-48">
                      <Select 
                        onValueChange={(value) => handleQuantityChange(day.id, value)}
                        value={selectedProduct && quantities[selectedProduct]?.[day.id]?.toString() || "0"}
                      >
                        <SelectTrigger className="w-full text-right">
                          <SelectValue placeholder="0" />
                        </SelectTrigger>
                        <SelectContent position="popper" className="bg-white">
                          {quantityOptions.map((qty) => (
                            <SelectItem key={qty} value={qty.toString()}>
                              {qty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="font-medium">{day.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 flex space-x-2 bg-gray-50 rtl:space-x-reverse">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={handleCancel}
              >
                חזור
              </Button>
              <Button 
                className="flex-1 bg-blue-500 hover:bg-blue-600" 
                onClick={handleSave}
              >
                שמור
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="fixed bottom-0 left-0 right-0 bg-green-500 p-4">
          <Button 
            className="w-full bg-white text-green-700 hover:bg-gray-100 font-medium py-2"
          >
            שליחת הזמנה
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default NewOrder;
