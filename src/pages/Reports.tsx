import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProductStat {
  product_id: string;
  product_name: string;
  total_ordered: number;
}

interface MonthlyStat {
  month: string;
  order_count: number;
  total_amount: number;
}

interface CustomerStat {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_amount: number;
  avg_order_amount: number;
}

// Interface for order items from the database
interface OrderItemData {
  product_id: string;
  products: {
    name: string;
  };
}

// Interface for orders from the database
interface OrderData {
  customer_id: string;
  created_at: string;
  total: number;
  customers: {
    name: string;
  };
}

const Reports = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState("products");
  const [activeTab, setActiveTab] = useState("products");

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch top products
        const { data: productsData, error: productsError } = await supabase
          .from('order_items')
          .select(`
            product_id,
            products!inner(name)
          `)
          .returns<OrderItemData[]>()
          .then(({ data, error }) => {
            if (error) throw error;
            
            if (!data || data.length === 0) return { data: [] as ProductStat[], error: null };
            
            // Process and aggregate the data
            const productCounts: Record<string, ProductStat> = {};
            
            data.forEach(item => {
              const productId = item.product_id;
              const productName = item.products.name;
              
              if (!productCounts[productId]) {
                productCounts[productId] = {
                  product_id: productId,
                  product_name: productName,
                  total_ordered: 0
                };
              }
              
              productCounts[productId].total_ordered += 1;
            });
            
            const formattedData = Object.values(productCounts)
              .sort((a, b) => b.total_ordered - a.total_ordered)
              .slice(0, 10);
            
            return { data: formattedData, error: null };
          });

        if (productsError) {
          console.error("Error fetching top products:", productsError);
          toast({
            title: "שגיאה בטעינת נתוני מוצרים",
            description: productsError.message,
            variant: "destructive",
          });
        } else {
          setTopProducts(productsData || []);
        }
        
        // Fetch monthly stats
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('orders')
          .select('created_at, total')
          .returns<Pick<OrderData, 'created_at' | 'total'>[]>()
          .then(({ data, error }) => {
            if (error) throw error;
            
            if (!data || data.length === 0) return { data: [] as MonthlyStat[], error: null };
            
            // Process and aggregate the data by month
            const monthlyStats: Record<string, MonthlyStat> = {};
            
            data.forEach(order => {
              const month = new Date(order.created_at).toISOString().substring(0, 7); // YYYY-MM format
              
              if (!monthlyStats[month]) {
                monthlyStats[month] = {
                  month: order.created_at,
                  order_count: 0,
                  total_amount: 0
                };
              }
              
              monthlyStats[month].order_count += 1;
              monthlyStats[month].total_amount += Number(order.total);
            });
            
            const formattedData = Object.values(monthlyStats)
              .sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime())
              .slice(0, 12);
            
            return { data: formattedData, error: null };
          });

        if (monthlyError) {
          console.error("Error fetching monthly stats:", monthlyError);
          toast({
            title: "שגיאה בטעינת נתוני הזמנות חודשיים",
            description: monthlyError.message,
            variant: "destructive",
          });
        } else {
          setMonthlyStats(monthlyData || []);
        }

        // If user is customer, fetch only their stats
        if (user.role === 'customer') {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (customerError) {
            console.error("Error fetching customer ID:", customerError);
          } else if (customerData?.id) {
            const { data: statsData, error: statsError } = await supabase
              .from('orders')
              .select(`
                customer_id,
                customers!inner(name),
                total
              `)
              .eq('customer_id', customerData.id)
              .returns<OrderData[]>()
              .then(({ data, error }) => {
                if (error) throw error;
                
                if (!data || data.length === 0) return { data: [] as CustomerStat[], error: null };
                
                // Aggregate the customer data
                const customerId = data[0].customer_id;
                const customerName = data[0].customers.name;
                const orderCount = data.length;
                const totalAmount = data.reduce((sum, order) => sum + Number(order.total), 0);
                const avgOrderAmount = totalAmount / orderCount;
                
                const customerStats = [{
                  customer_id: customerId,
                  customer_name: customerName,
                  order_count: orderCount,
                  total_amount: totalAmount,
                  avg_order_amount: avgOrderAmount
                }];
                
                return { data: customerStats, error: null };
              });
            
            if (statsError) {
              console.error("Error fetching customer stats:", statsError);
            } else {
              setCustomerStats(statsData || []);
            }
          }
        } else {
          // For admin users, fetch top customers
          const { data: customerStatsData, error: customerStatsError } = await supabase
            .from('orders')
            .select(`
              customer_id,
              customers!inner(name),
              total
            `)
            .returns<OrderData[]>()
            .then(({ data, error }) => {
              if (error) throw error;
              
              if (!data || data.length === 0) return { data: [] as CustomerStat[], error: null };
              
              // Process and aggregate the data by customer
              const customerStats: Record<string, CustomerStat> = {};
              
              data.forEach(order => {
                const customerId = order.customer_id;
                const customerName = order.customers.name;
                
                if (!customerStats[customerId]) {
                  customerStats[customerId] = {
                    customer_id: customerId,
                    customer_name: customerName,
                    order_count: 0,
                    total_amount: 0,
                    avg_order_amount: 0
                  };
                }
                
                customerStats[customerId].order_count += 1;
                customerStats[customerId].total_amount += Number(order.total);
              });
              
              // Calculate average order amount
              Object.values(customerStats).forEach(customer => {
                customer.avg_order_amount = customer.total_amount / customer.order_count;
              });
              
              const formattedData = Object.values(customerStats)
                .sort((a, b) => b.total_amount - a.total_amount)
                .slice(0, 10);
              
              return { data: formattedData, error: null };
            });
          
          if (customerStatsError) {
            console.error("Error fetching customer stats:", customerStatsError);
            toast({
              title: "שגיאה בטעינת נתוני לקוחות",
              description: customerStatsError.message,
              variant: "destructive",
            });
          } else {
            setCustomerStats(customerStatsData || []);
          }
        }
      } catch (error) {
        console.error("Unexpected error in reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 text-right" dir="rtl">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold">דוחות</h1>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => navigate('/dashboard')}>
            חזרה לדף הבית
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end mb-6">
          <div className="w-full sm:w-1/2 text-right">
            <Select value={selectedReport} onValueChange={setSelectedReport} dir="rtl">
              <SelectTrigger className="text-right">
                <SelectValue placeholder="בחר סוג דוח" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="products">מוצרים פופולריים</SelectItem>
                <SelectItem value="monthly">סטטיסטיקת הזמנות</SelectItem>
                <SelectItem value="customers">סטטיסטיקת לקוחות</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => setActiveTab(selectedReport)}
          >
            הצג דוח
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="space-y-6">
            <TabsContent value="products">
              <Card className="overflow-hidden">
                <CardHeader className="px-3 py-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">מוצרים פופולריים</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : topProducts.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={topProducts}
                          margin={{ top: 20, right: 5, left: 5, bottom: 70 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="product_name" 
                            type="category"
                            tick={{ fontSize: 10 }}
                            width={120}
                            tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                          />
                          <Tooltip formatter={(value) => [`${value} יחידות`, 'כמות הזמנות']} />
                          <Bar dataKey="total_ordered" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                      <Separator className="my-6" />
                      <div className="space-y-4 text-right">
                        {topProducts.map((product, index) => (
                          <div key={product.product_id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <span className="text-sm sm:text-lg">{product.total_ordered} יחידות</span>
                            <span className="font-medium text-xs sm:text-sm">{index + 1}. {product.product_name}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly">
              <Card className="overflow-hidden">
                <CardHeader className="px-3 py-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">סטטיסטיקת הזמנות חודשית</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : monthlyStats.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={monthlyStats}
                          margin={{ top: 20, right: 5, left: 5, bottom: 70 }}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            dataKey="month" 
                            type="category"
                            tickFormatter={formatMonth}
                            tick={{ fontSize: 10 }}
                            width={120}
                          />
                          <Tooltip formatter={(value, name) => [
                            name === 'order_count' ? `${value} הזמנות` : formatCurrency(Number(value)),
                            name === 'order_count' ? 'מספר הזמנות' : 'סכום כולל'
                          ]} />
                          <Bar dataKey="order_count" name="מספר הזמנות" fill="#8884d8" />
                          <Bar dataKey="total_amount" name="סכום כולל" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                      <Separator className="my-6" />
                      <div className="space-y-4 text-right">
                        {monthlyStats.map((month) => (
                          <div key={month.month} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                            <div className="text-right text-xs sm:text-sm">
                              <p>{month.order_count} הזמנות</p>
                              <p className="text-muted-foreground">{formatCurrency(month.total_amount)}</p>
                            </div>
                            <span className="font-medium text-xs sm:text-sm">{formatMonth(month.month)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers">
              <Card className="overflow-hidden">
                <CardHeader className="px-3 py-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">{user?.role === 'customer' ? 'נתוני הזמנות שלי' : 'סטטיסטיקת לקוחות'}</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6">
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : customerStats.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6">
                        {user?.role === 'customer' && customerStats[0] && (
                          <>
                            <Card className="overflow-hidden">
                              <CardHeader className="pb-2 px-3 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">סה"כ הזמנות</CardTitle>
                              </CardHeader>
                              <CardContent className="px-3 sm:px-6">
                                <div className="text-xl sm:text-2xl font-bold">{customerStats[0].order_count}</div>
                              </CardContent>
                            </Card>
                            <Card className="overflow-hidden">
                              <CardHeader className="pb-2 px-3 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">סה"כ הוצאות</CardTitle>
                              </CardHeader>
                              <CardContent className="px-3 sm:px-6">
                                <div className="text-xl sm:text-2xl font-bold">
                                  {formatCurrency(customerStats[0].total_amount)}
                                </div>
                              </CardContent>
                            </Card>
                            <Card className="overflow-hidden">
                              <CardHeader className="pb-2 px-3 sm:px-6">
                                <CardTitle className="text-xs sm:text-sm font-medium">עלות ממוצעת להזמנה</CardTitle>
                              </CardHeader>
                              <CardContent className="px-3 sm:px-6">
                                <div className="text-xl sm:text-2xl font-bold">
                                  {formatCurrency(customerStats[0].avg_order_amount)}
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        )}
                      </div>

                      {user?.role === 'admin' && (
                        <>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                              <Pie
                                data={customerStats}
                                dataKey="total_amount"
                                nameKey="customer_name"
                                cx="50%"
                                cy="50%"
                                outerRadius={90}
                                fill="#8884d8"
                                label={({ customer_name, percent }) => 
                                  `${customer_name.length > 10 ? customer_name.substring(0, 10) + '...' : customer_name}: ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {customerStats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            </PieChart>
                          </ResponsiveContainer>
                          <Separator className="my-6" />
                        </>
                      )}

                      <div className="space-y-4">
                        {user?.role === 'admin' ? (
                          customerStats.map((customer, index) => (
                            <div key={customer.customer_id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                              <div className="text-right text-xs sm:text-sm">
                                <p>{formatCurrency(customer.total_amount)}</p>
                                <p className="text-xs text-muted-foreground">
                                  ממוצע: {formatCurrency(customer.avg_order_amount)}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-xs sm:text-sm">{index + 1}. {customer.customer_name}</span>
                                <p className="text-xs text-muted-foreground">{customer.order_count} הזמנות</p>
                              </div>
                            </div>
                          ))
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">אין נתונים זמינים</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reports; 