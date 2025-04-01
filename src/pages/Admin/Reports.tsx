import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "../../components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface TopCustomer {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_amount: number;
}

interface ProductSalesStat {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  revenue: number;
}

interface CategorySalesStat {
  category: string;
  quantity_sold: number;
  revenue: number;
}

interface OrdersStats {
  total_count: number;
  total_value: number;
  average_value: number;
}

interface SummaryStats {
  total_customers: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const AdminReports = () => {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(true);
  
  // Report data states
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    total_customers: 0,
    total_orders: 0,
    total_revenue: 0,
    average_order_value: 0
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [productStats, setProductStats] = useState<ProductSalesStat[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategorySalesStat[]>([]);
  const [ordersStats, setOrdersStats] = useState<OrdersStats>({
    total_count: 0,
    total_value: 0,
    average_value: 0
  });

  useEffect(() => {
    if (!date?.from || !date?.to) return;
    
    const fetchReportData = async () => {
      try {
        setLoading(true);

        // Format dates for Supabase queries
        const fromDate = date.from.toISOString();
        const toDate = date.to.toISOString();
        
        // Count unique customers with orders in date range
        const { count: customersCount, error: customersError } = await supabase
          .from('orders')
          .select('customer_id', { count: 'exact', head: true })
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .not('customer_id', 'is', null);
        
        // Get orders stats
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('total')
          .gte('created_at', fromDate)
          .lte('created_at', toDate);
        
        if (!ordersError && ordersData) {
          const totalOrders = ordersData.length;
          const totalRevenue = ordersData.reduce((sum, order) => sum + Number(order.total), 0);
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
          
          setSummaryStats({
            total_customers: customersCount || 0,
            total_orders: totalOrders,
            total_revenue: totalRevenue,
            average_order_value: averageOrderValue
          });
        }
        
        // Fetch top customers in date range
        const { data: customerData, error: customerError } = await supabase
          .from('orders')
          .select(`
            customer_id,
            customers!inner(name),
            total
          `)
          .gte('created_at', fromDate)
          .lte('created_at', toDate)
          .order('created_at', { ascending: false });
        
        if (customerError) {
          console.error("Error fetching top customers:", customerError);
          toast({
            title: "שגיאה בטעינת נתוני לקוחות",
            description: customerError.message,
            variant: "destructive",
          });
        } else if (customerData) {
          // Process and aggregate the data by customer
          const customerStats: Record<string, TopCustomer> = {};
          
          customerData.forEach(order => {
            const customerId = order.customer_id;
            const customerName = order.customers.name;
            
            if (!customerStats[customerId]) {
              customerStats[customerId] = {
                customer_id: customerId,
                customer_name: customerName,
                order_count: 0,
                total_amount: 0
              };
            }
            
            customerStats[customerId].order_count += 1;
            customerStats[customerId].total_amount += Number(order.total);
          });
          
          // Sort by total amount and get top 10
          const formattedData = Object.values(customerStats)
            .sort((a, b) => b.total_amount - a.total_amount)
            .slice(0, 10);
          
          setTopCustomers(formattedData);
        }
        
        // Fetch product sales stats
        const { data: productsData, error: productsError } = await supabase
          .from('order_items')
          .select(`
            product_id,
            products!inner(name),
            quantity,
            price
          `)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);
        
        if (productsError) {
          console.error("Error fetching product stats:", productsError);
        } else if (productsData) {
          // Process and aggregate data by product
          const productSalesStats: Record<string, ProductSalesStat> = {};
          
          productsData.forEach(item => {
            const productId = item.product_id;
            const productName = item.products.name;
            const quantity = item.quantity || 1;
            const price = Number(item.price);
            
            if (!productSalesStats[productId]) {
              productSalesStats[productId] = {
                product_id: productId,
                product_name: productName,
                quantity_sold: 0,
                revenue: 0
              };
            }
            
            productSalesStats[productId].quantity_sold += quantity;
            productSalesStats[productId].revenue += price * quantity;
          });
          
          // Sort by revenue and get top 10
          const formattedData = Object.values(productSalesStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
          
          setProductStats(formattedData);
        }

        // Fetch category sales stats
        const { data: categoryData, error: categoryError } = await supabase
          .from('order_items')
          .select(`
            products!inner(category, name),
            quantity,
            price
          `)
          .gte('created_at', fromDate)
          .lte('created_at', toDate);
        
        if (categoryError) {
          console.error("Error fetching category stats:", categoryError);
        } else if (categoryData) {
          // Process and aggregate data by category
          const categorySalesStats: Record<string, CategorySalesStat> = {};
          
          categoryData.forEach(item => {
            const category = item.products.category || 'אחר';
            const quantity = item.quantity || 1;
            const price = Number(item.price);
            
            if (!categorySalesStats[category]) {
              categorySalesStats[category] = {
                category: category,
                quantity_sold: 0,
                revenue: 0
              };
            }
            
            categorySalesStats[category].quantity_sold += quantity;
            categorySalesStats[category].revenue += price * quantity;
          });
          
          // Sort by revenue
          const formattedData = Object.values(categorySalesStats)
            .sort((a, b) => b.revenue - a.revenue);
          
          setCategoryStats(formattedData);
        }
        
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "שגיאה בטעינת הדוחות",
          description: "אירעה שגיאה בעת טעינת נתוני הדוחות. נסה שוב מאוחר יותר.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [date]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount);
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 text-right" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">דוחות מנהל</h1>
      </div>

      <div className="mb-6">
        <DateRangePicker
          date={date}
          onDateChange={setDate}
          className="w-full sm:w-auto"
          locale="he"
          placeholder="בחר טווח תאריכים"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="summary">סיכום</TabsTrigger>
          <TabsTrigger value="customers">לקוחות</TabsTrigger>
          <TabsTrigger value="products">מוצרים</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="text-center">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-sm">סך הכל לקוחות</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                {loading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{summaryStats.total_customers}</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-sm">סך הכל הזמנות</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                {loading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{summaryStats.total_orders}</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-sm">סך הכל הכנסות</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                {loading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{formatCurrency(summaryStats.total_revenue)}</div>
                )}
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader className="py-3 pb-1">
                <CardTitle className="text-sm">ממוצע להזמנה</CardTitle>
              </CardHeader>
              <CardContent className="py-6">
                {loading ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <div className="text-3xl font-bold">{formatCurrency(summaryStats.average_order_value)}</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>לקוח מוביל</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-52 w-full" />
                ) : topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="mb-2 text-lg font-bold">{topCustomers[0].customer_name}</div>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">סך הזמנות</div>
                          <div className="text-3xl font-bold mt-1">{formatCurrency(topCustomers[0].total_amount)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">כמות הזמנות</div>
                          <div className="text-3xl font-bold mt-1">{topCustomers[0].order_count}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">אין נתונים זמינים</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>מוצר מוביל</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-52 w-full" />
                ) : productStats.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="mb-2 text-lg font-bold">{productStats[0].product_name}</div>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">סך הכנסות</div>
                          <div className="text-3xl font-bold mt-1">{formatCurrency(productStats[0].revenue)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">יחידות שנמכרו</div>
                          <div className="text-3xl font-bold mt-1">{productStats[0].quantity_sold}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">אין נתונים זמינים</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>לקוחות מובילים</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topCustomers.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {topCustomers.map((customer, index) => (
                      <div key={customer.customer_id} className="flex justify-between items-center p-4 rounded-md hover:bg-muted border-b">
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-shrink-0 font-bold text-lg w-6 text-center">{index + 1}</div>
                          <div className="flex-grow">
                            <div className="font-medium text-base">{customer.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{customer.order_count} הזמנות</div>
                          </div>
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(customer.total_amount)}
                          </div>
                        </div>
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

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>מוצרים מובילים לפי הכנסות</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : productStats.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {productStats.map((product, index) => (
                      <div key={product.product_id} className="flex justify-between items-center p-4 rounded-md hover:bg-muted border-b">
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-shrink-0 font-bold text-lg w-6 text-center">{index + 1}</div>
                          <div className="flex-grow">
                            <div className="font-medium text-base">{product.product_name}</div>
                            <div className="text-sm text-muted-foreground">{product.quantity_sold} יחידות</div>
                          </div>
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(product.revenue)}
                          </div>
                        </div>
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

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>מכירות לפי קטגוריות</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categoryStats.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {categoryStats.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-4 rounded-md hover:bg-muted border-b">
                        <div className="flex items-center gap-4 w-full">
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div className="flex-grow">
                            <div className="font-medium text-base">{category.category}</div>
                            <div className="text-sm text-muted-foreground">{category.quantity_sold} יחידות</div>
                          </div>
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(category.revenue)}
                          </div>
                        </div>
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
      </Tabs>
    </div>
  );
};

export default AdminReports; 