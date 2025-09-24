import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import SapMigrationPopup from "@/components/SapMigrationPopup"; // Removed - using Supabase only
import { DateRangePicker } from "../../components/ui/date-range-picker";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { getReports } from "@/services/reportService";

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
  // const [showSapPopup, setShowSapPopup] = useState(true); // Removed - using Supabase only
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

        // Fetch report data - for admin reports, we need to get all data, not user-specific
        // We'll need to modify the getReports function to handle admin case
        const reportData = await getReports(date.from, date.to, 'admin');
        
        if (!reportData) {
          setLoading(false);
          return;
        }
        
        // Process summary stats
        if (reportData.summary) {
          setSummaryStats({
            total_customers: reportData.summary.totalCustomers,
            total_orders: reportData.summary.totalOrders,
            total_revenue: reportData.summary.totalRevenue,
            average_order_value: reportData.summary.averageOrderValue
          });
        }
        
        // Process customer stats
        if (reportData.customerStats) {
          const formattedCustomers = reportData.customerStats.map(item => ({
            customer_id: item.cardCode,
            customer_name: item.cardName,
            order_count: item.orderCount,
            total_amount: item.totalAmount
          }))
          .sort((a, b) => b.total_amount - a.total_amount)
          .slice(0, 10);
          
          setTopCustomers(formattedCustomers);
        }
        
        // Process product stats
        if (reportData.productStats) {
          const formattedProducts = reportData.productStats.map(item => ({
            product_id: item.itemCode,
            product_name: item.description,
            quantity_sold: item.quantity,
            revenue: item.revenue || 0
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);
          
          setProductStats(formattedProducts);
          
          // Process category stats (group by first word in product name as a simple approach)
          const categoriesMap: Record<string, CategorySalesStat> = {};
          
          reportData.productStats.forEach(item => {
            // Extract category from product name (first word)
            const category = item.description.split(' ')[0] || 'אחר';
            
            if (!categoriesMap[category]) {
              categoriesMap[category] = {
                category,
                quantity_sold: 0,
                revenue: 0
              };
            }
            
            categoriesMap[category].quantity_sold += item.quantity;
            categoriesMap[category].revenue += item.revenue || 0;
          });
          
          const formattedCategories = Object.values(categoriesMap)
            .sort((a, b) => b.revenue - a.revenue);
          
          setCategoryStats(formattedCategories);
        }
        
        // Process orders stats
        if (reportData.summary) {
          setOrdersStats({
            total_count: reportData.summary.totalOrders,
            total_value: reportData.summary.totalRevenue,
            average_value: reportData.summary.averageOrderValue
          });
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
        toast({
          title: "שגיאה בטעינת דוחות",
          description: error instanceof Error ? error.message : "אירעה שגיאה בטעינת הדוחות",
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">דוחות ניהוליים</h1>
        <div className="w-full md:w-auto">
          <DateRangePicker
            date={date}
            onDateChange={setDate}
            locale="he"
            placeholder="בחר טווח תאריכים"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 justify-center">
          <TabsTrigger value="summary">סיכום</TabsTrigger>
          <TabsTrigger value="products">מוצרים</TabsTrigger>
          <TabsTrigger value="categories">קטגוריות</TabsTrigger>
          <TabsTrigger value="customers">לקוחות</TabsTrigger>
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
                  <div className="text-2xl font-bold">{summaryStats.total_customers}</div>
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
                  <div className="text-2xl font-bold">{summaryStats.total_orders}</div>
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
                  <div className="text-2xl font-bold">{formatCurrency(summaryStats.total_revenue)}</div>
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
                <CardTitle className="text-right text-lg">לקוח מוביל</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-52 w-full" />
                ) : topCustomers.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="mb-2 text-base font-bold">{topCustomers[0].customer_name}</div>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">סך הזמנות</div>
                          <div className="text-2xl font-bold mt-1">{formatCurrency(topCustomers[0].total_amount)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">כמות הזמנות</div>
                          <div className="text-2xl font-bold mt-1">{topCustomers[0].order_count}</div>
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
                <CardTitle className="text-right text-lg">מוצר מוביל</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-52 w-full" />
                ) : productStats.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-6 bg-muted rounded-lg text-center">
                      <div className="mb-2 text-base font-bold">{productStats[0].product_name}</div>
                      <div className="flex justify-around">
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">סך הכנסות</div>
                          <div className="text-2xl font-bold mt-1">{formatCurrency(productStats[0].revenue)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-muted-foreground">יחידות שנמכרו</div>
                          <div className="text-2xl font-bold mt-1">{productStats[0].quantity_sold}</div>
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

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">מוצרים מובילים לפי הכנסות</CardTitle>
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
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(product.revenue)}
                          </div>
                          <div className="flex-grow text-right">
                            <div className="font-medium text-base">{product.product_name}</div>
                            <div className="text-sm text-muted-foreground">{product.quantity_sold} יחידות</div>
                          </div>
                          <div className="flex-shrink-0 font-bold text-lg w-6 text-center">{index + 1}</div>
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
              <CardTitle className="text-right text-lg">מכירות לפי קטגוריות</CardTitle>
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
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(category.revenue)}
                          </div>
                          <div className="flex-grow text-right">
                            <div className="font-medium text-base">{category.category}</div>
                            <div className="text-sm text-muted-foreground">{category.quantity_sold} יחידות</div>
                          </div>
                          <div 
                            className="flex-shrink-0 w-5 h-5 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
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

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">לקוחות מובילים</CardTitle>
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
                          <div className="text-right font-bold text-lg">
                            {formatCurrency(customer.total_amount)}
                          </div>
                          <div className="flex-grow text-right">
                            <div className="font-medium text-base">{customer.customer_name}</div>
                            <div className="text-sm text-muted-foreground">{customer.order_count} הזמנות</div>
                          </div>
                          <div className="flex-shrink-0 font-bold text-lg w-6 text-center">{index + 1}</div>
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
      
      {/* SAP Migration Popup - Removed, using Supabase only */}
    </div>
  );
};

export default AdminReports; 