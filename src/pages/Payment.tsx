import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import MainLayout from "@/components/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { OrderProduct } from "@/components/order/orderConstants";
import { useAuth } from "@/context/AuthContext";

interface PaymentPageState {
  quantities: Record<string, number>;
  products: OrderProduct[];
  targetDate?: Date;
  adminSelectedCustomer?: {id: string, name: string, phone: string, city?: string} | null;
}

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const state = location.state as PaymentPageState;
  const { quantities, products, targetDate, adminSelectedCustomer } = state || {};

  // Calculate total
  const calculateTotal = () => {
    if (!quantities || !products) return 0;
    return Object.entries(quantities).reduce((sum, [productId, qty]) => {
      const product = products.find(p => p.id === productId);
      return sum + (product?.price || 0) * qty;
    }, 0);
  };

  const total = calculateTotal();

  // Redirect if no order data
  useEffect(() => {
    if (!quantities || !products || Object.keys(quantities).length === 0) {
      toast.error("לא נמצאו פרטי הזמנה");
      navigate("/orders/new");
    }
  }, [quantities, products, navigate]);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("הועתק ללוח");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirmPayment = () => {
    // Navigate to order summary to complete the order
    navigate("/orders/summary", {
      state: {
        quantities,
        products,
        targetDate,
        adminSelectedCustomer,
        paymentConfirmed: true
      }
    });
  };

  const handleBackToSummary = () => {
    navigate("/orders/summary", {
      state: {
        quantities,
        products,
        targetDate,
        adminSelectedCustomer
      }
    });
  };

  if (!quantities || !products) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">פרטי תשלום</h1>
            <p className="text-gray-600">אנא בצע העברה בנקאית או תשלום דרך BIT</p>
          </div>

          {/* Total Amount Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6 bg-gradient-to-br from-bottle-50 to-bottle-100 border-bottle-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">סכום לתשלום</p>
                  <p className="text-4xl font-bold text-bottle-700">₪{total.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods */}
          <div className="space-y-4">
            {/* Bank Transfer */}
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">העברה בנקאית</CardTitle>
                      <CardDescription>העבר לחשבון הבנק שלנו</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">שם הבנק:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">בנק לאומי</span>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">מספר סניף:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">XXX</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy("XXX", "branch")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "branch" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">מספר חשבון:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">XXXXXXXX</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy("XXXXXXXX", "account")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "account" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">שם המוטב:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">מינרל גז - אביגל טורג'מן</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <strong>חשוב:</strong> אנא ציין בהעברה את מספר הטלפון שלך לזיהוי התשלום
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* BIT Payment */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Smartphone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">תשלום ב-BIT</CardTitle>
                      <CardDescription>העבר באמצעות אפליקציית BIT</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">מספר טלפון:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-lg">050-XXXXXXX</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy("050XXXXXXX", "phone")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "phone" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">שם המוטב:</span>
                      <span className="font-semibold">אביגל טורג'מן</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>טיפ:</strong> פתח את אפליקציית BIT והעבר את הסכום למספר הטלפון המצוין
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Future Integration Notice */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        תשלום מקוון בקרוב
                      </p>
                      <p className="text-xs text-gray-500">
                        בעתיד תוכל לשלם באמצעות כרטיס אשראי ישירות דרך המערכת
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg text-green-900">הוראות תשלום</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 text-sm text-green-800">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>בצע העברה בנקאית או תשלום ב-BIT לפי הפרטים המצוינים למעלה</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>ודא שציינת את מספר הטלפון שלך בהעברה</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>לחץ על "אישור תשלום והשלמת הזמנה" למטה</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>נאשר את התשלום ונעדכן אותך על מצב ההזמנה</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg"
          >
            <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleBackToSummary}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                חזרה לסיכום
              </Button>
              <Button
                onClick={handleConfirmPayment}
                className="flex-1 bg-bottle-600 hover:bg-bottle-700 text-white font-medium flex items-center justify-center gap-2"
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5" />
                אישור תשלום והשלמת הזמנה
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Payment;

