import { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { getReports, getOpenOrders } from "@/services/reportService";

// Import report components
import SummaryStats from "@/components/reports/SummaryStats";
import ProductsChart from "@/components/reports/ProductsChart";
import ProductsLeaderboard from "@/components/reports/ProductsLeaderboard";
import MonthlySalesChart from "@/components/reports/MonthlySalesChart";
import OrdersTimeline from "@/components/reports/OrdersTimeline";

interface ProductStat {
  product_id: string;
  product_name: string;
  total_ordered: number;
  revenue?: number;
}

interface MonthlyStat {
  month: string;
  order_count: number;
  total_amount: number;
}


interface SummaryStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalServiceRequests: number;
}

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  completed_at?: string;
}

interface CustomerOrder {
  id: string;
  status: string;
  total: number;
  created_at: string;
  target_date?: string;
  order_items_count: number;
}

const Reports = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalServiceRequests: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -120),
    to: new Date(),
  });

  const quickPresets = [
    { label: "7 ימים אחרונים", days: 7 },
    { label: "30 ימים אחרונים", days: 30 },
    { label: "90 ימים אחרונים", days: 90 },
    { label: "120 ימים אחרונים", days: 120 },
  ];

  const applyPreset = (days: number) => {
    const to = new Date();
    const from = addDays(new Date(), -days);
    setDate({ from, to });
  };

  // Build daily timeline data with zeros for missing days
  const buildTimelineData = useCallback(() => {
    if (!date?.from || !date?.to) return [] as { date: string; count: number }[];
    const counts: Record<string, number> = {};
    customerOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const result: { date: string; count: number }[] = [];
    const start = new Date(date.from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date.to);
    end.setHours(0, 0, 0, 0);
    for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
      const key = `${d.getFullYear()}-${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      result.push({ date: key, count: counts[key] || 0 });
    }
    return result;
  }, [customerOrders, date?.from, date?.to]);

  const tabOptions = [
    { value: "summary", label: "סיכום פעילות" },
    { value: "products", label: "מוצרים שהזמנתי" },
    { value: "services", label: "קריאות שירות" },
    { value: "timeline", label: "ציר זמן" }
  ];

  const fetchCustomerData = useCallback(async () => {
    if (!user?.id || !date?.from || !date?.to) return;
    
    try {
      // Get customer ID for this user
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', user.phone) // Assuming user.phone matches customer phone
        .single();

      if (customerError || !customer) {
        console.log('Customer not found for user:', user.phone);
        return { customerId: null };
      }

      // Fetch customer orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total,
          created_at,
          target_date,
          order_items(count)
        `)
        .eq('customer_id', customer.id)
        .gte('created_at', date.from.toISOString())
        .lte('created_at', date.to.toISOString())
        .order('created_at', { ascending: false });

      // Fetch service requests
      const { data: requests, error: requestsError } = await supabase
        .from('service_requests')
        .select('id, title, status, priority, created_at, completed_at')
        .eq('customer_id', customer.id)
        .gte('created_at', date.from.toISOString())
        .lte('created_at', date.to.toISOString())
        .order('created_at', { ascending: false });

      return {
        customerId: customer.id,
        orders: orders || [],
        serviceRequests: requests || [],
        ordersError,
        requestsError
      };
    } catch (error) {
      console.error('Error fetching customer data:', error);
      return { customerId: null, error };
    }
  }, [user?.id, user?.phone, date?.from, date?.to]);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user?.id || !date?.from || !date?.to) return;
      
      try {
        setLoading(true);
        
        // Fetch customer-specific data
        const customerData = await fetchCustomerData();
        
        if (!customerData.customerId) {
          setLoading(false);
          return;
        }

        // Set customer orders and service requests
        const formattedOrders = (customerData.orders || []).map((order) => ({
          id: order.id,
          status: order.status,
          total: order.total,
          created_at: order.created_at,
          target_date: order.target_date,
          order_items_count: order.order_items?.[0]?.count || 0
        }));
        setCustomerOrders(formattedOrders);
        setServiceRequests(customerData.serviceRequests || []);

        // Fetch report data for products and summary (skip if no customer found)
        const reportData = customerData.customerId ? await getReports(date.from, date.to, user.phone, 'all') : null;
        
        // Process summary stats
        if (reportData?.summary) {
          setSummaryStats({
            totalOrders: reportData.summary.totalOrders || 0,
            totalRevenue: reportData.summary.totalRevenue || 0,
            averageOrderValue: reportData.summary.averageOrderValue || 0,
            totalServiceRequests: reportData.summary.totalServiceRequests || 0
          });
        }
        
        // Process product stats
        if (reportData?.productStats) {
          const formattedProducts = reportData.productStats.map(item => ({
            product_id: item.itemCode,
            product_name: item.description,
            total_ordered: item.quantity,
            revenue: item.revenue
          })).sort((a, b) => b.total_ordered - a.total_ordered).slice(0, 10);
          
          setTopProducts(formattedProducts);
        } else {
          // Fallback to legacy method if API doesn't return product stats
          const orderItems = await getOpenOrders(date.from, date.to, user.phone);
          
          if (orderItems && orderItems.length > 0) {
            const productMap: Record<string, ProductStat> = {};
            orderItems.forEach(item => {
              const productId = item.itemCode;
              const productName = item.description || 'מוצר לא ידוע';
              
              if (!productMap[productId]) {
                productMap[productId] = {
                  product_id: productId,
                  product_name: productName,
                  total_ordered: 0
                };
              }
              productMap[productId].total_ordered += item.quantity;
            });
            
            const formattedProducts = Object.values(productMap)
              .sort((a, b) => b.total_ordered - a.total_ordered)
              .slice(0, 10);
            
            setTopProducts(formattedProducts);
          }
        }
        
        // Process monthly stats from customer orders (use formattedOrders instead of customerOrders state)
        const monthlyMap: Record<string, MonthlyStat> = {};
        formattedOrders.forEach(order => {
          const date = new Date(order.created_at);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = {
              month: monthKey,
              order_count: 0,
              total_amount: 0
            };
          }
          
          monthlyMap[monthKey].order_count += 1;
          monthlyMap[monthKey].total_amount += order.total || 0;
        });
        
        const formattedMonthly = Object.values(monthlyMap)
          .sort((a, b) => a.month.localeCompare(b.month));
        
        setMonthlyStats(formattedMonthly);
      } catch (error) {
        console.error("Error fetching reports:", error);
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
  }, [user?.id, user?.phone, date, fetchCustomerData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">הפעילות שלי</h1>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              חזרה לדף הבית
            </Button>
          </div>
          <div className="w-full md:w-auto">
            <DateRangePicker
              date={date}
              onDateChange={setDate}
              locale="he"
              placeholder="בחר טווח תאריכים"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {quickPresets.map((p) => (
                <Button key={p.days} variant="outline" size="sm" onClick={() => applyPreset(p.days)}>
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {isMobile ? (
          <div className="mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר דוח" />
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          /* Desktop Tabs */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              {tabOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Content for both mobile and desktop */}
        <div className="w-full">

          {activeTab === "summary" && (
            <div className="space-y-6">
              <SummaryStats 
                loading={loading}
                totalOrders={summaryStats.totalOrders}
                totalSpent={summaryStats.totalRevenue}
                averageOrderValue={summaryStats.averageOrderValue}
                totalServiceRequests={summaryStats.totalServiceRequests}
              />
              
              <div className="grid gap-6 md:grid-cols-2">
                <ProductsLeaderboard loading={loading} products={topProducts.slice(0, 5)} />
                <OrdersTimeline loading={loading} data={buildTimelineData()} />
              </div>
            </div>
          )}


          {/* orders tab removed - use dedicated OrderHistory page */}

          {activeTab === "products" && (
            <ProductsLeaderboard loading={loading} products={topProducts} />
          )}

          {activeTab === "services" && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">קריאות שירות שלי</h3>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : serviceRequests.length > 0 ? (
                <div className="space-y-3">
                  {serviceRequests.map((request) => (
                    <Card key={request.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(request.created_at).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <div className="text-left">
                          <Badge variant={
                            request.status === 'completed' ? 'default' :
                            request.status === 'in_progress' ? 'secondary' :
                            request.priority === 'urgent' ? 'destructive' : 'outline'
                          }>
                            {request.status === 'pending' ? 'ממתין' :
                             request.status === 'in_progress' ? 'בטיפול' :
                             request.status === 'completed' ? 'הושלם' :
                             request.status === 'cancelled' ? 'בוטל' : request.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {request.priority === 'urgent' ? 'דחוף' :
                             request.priority === 'high' ? 'גבוה' :
                             request.priority === 'normal' ? 'רגיל' : 'נמוך'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-gray-500">אין קריאות שירות בתקופה זו</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <OrdersTimeline loading={loading} data={buildTimelineData()} />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports; 