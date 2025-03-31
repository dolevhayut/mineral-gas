
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { sampleOrders } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Orders = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  const userOrders = sampleOrders.filter((order) => order.userId === user?.id);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case "pending": return "ממתין";
      case "processing": return "בתהליך";
      case "completed": return "הושלם";
      case "cancelled": return "בוטל";
      default: return status;
    }
  };
  
  if (userOrders.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">ההזמנות שלי</h1>
            <p className="text-gray-500 mb-8">
              אין לך הזמנות קודמות.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold mb-6 text-center">ההזמנות שלי</h1>
        
        <div className="space-y-4">
          {userOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <Badge 
                    variant="outline"
                    className={getStatusColor(order.status)}
                  >
                    {translateStatus(order.status)}
                  </Badge>
                  <div className="text-right">
                    <h3 className="font-medium">הזמנה #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-medium mb-1 text-right">פריטים:</h4>
                  <ul className="space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index} className="text-sm flex justify-between">
                        <span className="text-gray-500">x{item.quantity}</span>
                        <span>{item.productName}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                  <span className="font-bold">{formatCurrency(order.total)}</span>
                  <span className="text-sm font-medium">סה"כ:</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Orders;
