import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { getOpenOrders, getReports } from "@/services/vawoOrderService";
import { useIsMobile } from "@/hooks/use-mobile";

// Import report components
import SummaryStats from "@/components/reports/SummaryStats";
import ProductsChart from "@/components/reports/ProductsChart";
import MonthlySalesChart from "@/components/reports/MonthlySalesChart";
import CustomersChart from "@/components/reports/CustomersChart";
import DailySalesChart from "@/components/reports/DailySalesChart";
import ProductsPieChart from "@/components/reports/ProductsPieChart";

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

interface CustomerStat {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_amount: number;
  avg_order_amount: number;
}

interface DailySalesStat {
  date: string;
  order_count: number;
  total_amount: number;
}

interface SummaryStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
}

const Reports = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [topProducts, setTopProducts] = useState<ProductStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStat[]>([]);
  const [dailySales, setDailySales] = useState<DailySalesStat[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    totalCustomers: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const tabOptions = [
    { value: "summary", label: "סיכום" },
    { value: "products", label: "מוצרים פופולריים" },
    { value: "monthly", label: "מכירות חודשיות" },
    { value: "daily", label: "מכירות יומיות" },
    { value: "distribution", label: "התפלגות מוצרים" }
  ];

  useEffect(() => {
    const fetchReportData = async () => {
      if (!user?.id || !date?.from || !date?.to) return;
      
      try {
        setLoading(true);
        
        // Fetch report data from VAWO API
        const reportData = await getReports(date.from, date.to, 'all');
        
        if (!reportData) {
          setLoading(false);
          return;
        }
        
        // Process summary stats
        if (reportData.summary) {
          setSummaryStats({
            totalOrders: reportData.summary.totalOrders || 0,
            totalRevenue: reportData.summary.totalRevenue || 0,
            averageOrderValue: reportData.summary.averageOrderValue || 0,
            totalCustomers: reportData.summary.totalCustomers || 0
          });
        }
        
        // Process product stats
        if (reportData.productStats) {
          const formattedProducts = reportData.productStats.map(item => ({
            product_id: item.itemCode,
            product_name: item.description,
            total_ordered: item.quantity,
            revenue: item.revenue
          })).sort((a, b) => b.total_ordered - a.total_ordered).slice(0, 10);
          
          setTopProducts(formattedProducts);
        } else {
          // Fallback to legacy method if API doesn't return product stats
          const orderItems = await getOpenOrders(date.from, date.to);
          
          if (orderItems && orderItems.length > 0) {
            const productMap: Record<string, ProductStat> = {};
            orderItems.forEach(item => {
              if (!productMap[item.itemCode]) {
                productMap[item.itemCode] = {
                  product_id: item.itemCode,
                  product_name: item.description,
                  total_ordered: 0
                };
              }
              productMap[item.itemCode].total_ordered += item.quantity;
            });
            
            const formattedProducts = Object.values(productMap)
              .sort((a, b) => b.total_ordered - a.total_ordered)
              .slice(0, 10);
            
            setTopProducts(formattedProducts);
          }
        }
        
        // Process customer stats
        if (reportData.customerStats) {
          const formattedCustomers = reportData.customerStats.map(item => ({
            customer_id: item.cardCode,
            customer_name: item.cardName,
            order_count: item.orderCount,
            total_amount: item.totalAmount,
            avg_order_amount: item.totalAmount / (item.orderCount || 1)
          })).sort((a, b) => b.total_amount - a.total_amount).slice(0, 10);
          
          setCustomerStats(formattedCustomers);
        }
        
        // Process daily sales
        if (reportData.dailySales) {
          const formattedDailySales = reportData.dailySales.map(item => ({
            date: item.date,
            order_count: item.orderCount,
            total_amount: item.totalAmount
          })).sort((a, b) => a.date.localeCompare(b.date));
          
          setDailySales(formattedDailySales);
        }
        
        // Process monthly stats from daily data if available
        if (reportData.dailySales) {
          const monthlyMap: Record<string, MonthlyStat> = {};
          reportData.dailySales.forEach(item => {
            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            if (!monthlyMap[monthKey]) {
              monthlyMap[monthKey] = {
                month: monthKey,
                order_count: 0,
                total_amount: 0
              };
            }
            
            monthlyMap[monthKey].order_count += item.orderCount;
            monthlyMap[monthKey].total_amount += item.totalAmount;
          });
          
          const formattedMonthly = Object.values(monthlyMap)
            .sort((a, b) => a.month.localeCompare(b.month));
          
          setMonthlyStats(formattedMonthly);
        } else {
          // Fallback to legacy method if API doesn't return daily sales
          const orderItems = await getOpenOrders(date.from, date.to);
          
          if (orderItems && orderItems.length > 0) {
            const parseAsLocalDate = (dateString: string): Date => {
              const fixedDate = dateString.startsWith('0') ? dateString.substring(1) : dateString;
              const parts = fixedDate.split('-').map(Number);
              return new Date(parts[0], parts[1] - 1, parts[2]);
            };
            
            const processedOrders = orderItems.map(item => ({
              ...item,
              localDueDate: parseAsLocalDate(item.dueDate),
            }));
            
            const monthlyMap: Record<string, MonthlyStat> = {};
            processedOrders.forEach(item => {
              const monthKey = `${item.localDueDate.getFullYear()}-${(item.localDueDate.getMonth() + 1).toString().padStart(2, '0')}`;
              
              if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                  month: monthKey,
                  order_count: 0,
                  total_amount: 0
                };
              }
              
              if (!monthlyMap[monthKey].order_count) {
                monthlyMap[monthKey].order_count = 1;
              }
              
              const estimatedAmount = item.quantity * 50;
              monthlyMap[monthKey].total_amount += estimatedAmount;
            });
            
            const formattedMonthly = Object.values(monthlyMap)
              .sort((a, b) => a.month.localeCompare(b.month));
            
            setMonthlyStats(formattedMonthly);
          }
        }
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
  }, [user?.id, date]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4" dir="rtl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <h1 className="text-2xl font-bold">דוחות</h1>
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
                totalRevenue={summaryStats.totalRevenue}
                averageOrderValue={summaryStats.averageOrderValue}
                totalCustomers={summaryStats.totalCustomers}
              />
              
              <div className="grid gap-6 md:grid-cols-2">
                <ProductsChart loading={loading} products={topProducts.slice(0, 5)} />
                <MonthlySalesChart loading={loading} monthlyStats={monthlyStats.slice(-6)} />
              </div>
            </div>
          )}

          {activeTab === "products" && (
            <ProductsChart loading={loading} products={topProducts} showRevenue={true} />
          )}

          {activeTab === "monthly" && (
            <MonthlySalesChart loading={loading} monthlyStats={monthlyStats} />
          )}

          {activeTab === "daily" && (
            <DailySalesChart loading={loading} dailySales={dailySales} />
          )}
          
          {activeTab === "distribution" && (
            <div className="grid gap-6 md:grid-cols-2">
              <ProductsPieChart 
                loading={loading} 
                products={topProducts} 
                title="התפלגות מוצרים לפי כמות" 
              />
              <ProductsPieChart 
                loading={loading} 
                products={topProducts} 
                showRevenue={true} 
                title="התפלגות מוצרים לפי הכנסות" 
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Reports; 