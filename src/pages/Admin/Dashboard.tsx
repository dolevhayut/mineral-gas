import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, ShoppingCartIcon, UsersIcon, TrendingUpIcon, Loader2, Package, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { SystemUpdatesManager } from "@/components/SystemUpdatesManager";
import { AIQueryAssistant } from "@/components/AIQueryAssistant";
import Chart from 'react-apexcharts';
import type { Tables } from "@/lib/database.types";

export default function Dashboard() {
  // הגדרת שאילתות לנתונים אמיתיים
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // סטטיסטיקות מוצרים
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id")
        .order("created_at", { ascending: false });
        
      if (productsError) {
        console.error("Error fetching products:", productsError);
      }
      
      // ספירת מוצרים חדשים בחודש האחרון
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const { count: newProductsCount, error: newProductsError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .gte("created_at", lastMonth.toISOString());
        
      if (newProductsError) {
        console.error("Error fetching new products:", newProductsError);
      }
      
      // סטטיסטיקות הזמנות
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("id, total, created_at, customer_id")
        .order("created_at", { ascending: false });
        
      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
      }
      
      // הזמנות מהיום
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = ordersData?.filter(order => 
        new Date(order.created_at) >= today
      ) || [];
      
      // חישוב הכנסות
      const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      
      // חישוב הכנסות מהחודש הקודם לצורך השוואה
      const currentMonth = new Date().getMonth();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      
      const currentMonthOrders = ordersData?.filter(order => 
        new Date(order.created_at).getMonth() === currentMonth
      ) || [];
      
      const prevMonthOrders = ordersData?.filter(order => 
        new Date(order.created_at).getMonth() === prevMonth
      ) || [];
      
      const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);
      const prevMonthRevenue = prevMonthOrders.reduce((sum, order) => sum + Number(order.total), 0);
      
      const revenueChangePercent = prevMonthRevenue === 0 
        ? 100 
        : Math.round((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue * 100);
      
      // סטטיסטיקות לקוחות
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("id, created_at")
        .order("created_at", { ascending: false });
        
      if (customersError) {
        console.error("Error fetching customers:", customersError);
      }
      
      // ספירת לקוחות חדשים בחודש האחרון
      const newCustomers = customersData?.filter(customer => 
        new Date(customer.created_at) >= lastMonth
      ) || [];
      
      // מוצרים פופולריים
      const { data: orderItemsData, error: orderItemsError } = await supabase
        .from("order_items")
        .select(`
          product_id,
          quantity,
          products:products(name, price)
        `);
        
      if (orderItemsError) {
        console.error("Error fetching order items:", orderItemsError);
      }
      
      // חישוב מוצרים פופולריים
      const productStats: Record<string, { id: string, name: string, price: number, count: number }> = {};
      
      orderItemsData?.forEach((item: any) => {
        const productId = item.product_id || "";
        // נטפל בתוצאות כמו שהן מוחזרות מsupabase בפורמט של foreign key join
        const product = Array.isArray(item.products) ? item.products[0] : item.products;
        const productName = product?.name || "מוצר לא ידוע";
        const productPrice = Number(product?.price) || 0;
        const quantity = item.quantity || 1;
        
        if (!productStats[productId]) {
          productStats[productId] = {
            id: productId,
            name: productName,
            price: productPrice,
            count: 0
          };
        }
        
        productStats[productId].count += quantity;
      });
      
      const popularProducts = Object.values(productStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // הזמנות אחרונות עם פרטי לקוח
      const recentOrders = ordersData?.slice(0, 3).map(order => {
        // We'll use a simpler approach for getting the product name to avoid type errors
        const orderItems = orderItemsData?.filter((item: any) => item.product_id === order.id) || [];
        let mainProduct = "הזמנה מעורבת";
        
        if (orderItems.length > 0 && orderItems[0].products) {
          const product = orderItems[0].products;
          // Check if it's an array and handle appropriately
          if (Array.isArray(product) && product.length > 0) {
            mainProduct = product[0].name || "מוצר לא ידוע";
          } else if (typeof product === 'object' && product !== null && 'name' in product) {
            mainProduct = product.name || "מוצר לא ידוע";
          }
        }
        
        return {
          id: order.id,
          productName: mainProduct,
          total: order.total || 0,
          customer_id: order.customer_id || ""
        };
      }) || [];
      
      // קבלת שמות לקוחות להזמנות אחרונות
      const recentOrdersWithCustomers = await Promise.all(
        recentOrders.map(async (order) => {
          const { data: customerData } = await supabase
            .from("customers")
            .select("name")
            .eq("id", order.customer_id)
            .single();
            
          return {
            ...order,
            customerName: customerData?.name || "לקוח לא מזוהה"
          };
        })
      );
      
      // נתוני גרפים - הכנסות לפי חודשים (6 חודשים אחרונים)
      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          month: date.getMonth(),
          year: date.getFullYear(),
          name: date.toLocaleDateString('he-IL', { month: 'short' })
        };
      });
      
      const revenueByMonth = last6Months.map(({ month, year, name }) => {
        const monthOrders = ordersData?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === month && orderDate.getFullYear() === year;
        }) || [];
        
        const revenue = monthOrders.reduce((sum, order) => sum + Number(order.total), 0);
        const ordersCount = monthOrders.length;
        
        return {
          name,
          הכנסות: revenue,
          הזמנות: ordersCount
        };
      });
      
      // נתוני גרף עוגה - התפלגות מוצרים
      const pieChartData = Object.values(productStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(product => ({
          name: product.name,
          value: product.count
        }));
      
      return {
        productsCount: productsData?.length || 0,
        newProductsCount: newProductsCount || 0,
        ordersCount: ordersData?.length || 0,
        todayOrdersCount: todayOrders.length,
        customersCount: customersData?.length || 0,
        newCustomersCount: newCustomers.length,
        totalRevenue,
        revenueChangePercent,
        popularProducts,
        recentOrders: recentOrdersWithCustomers.slice(0, 3),
        revenueByMonth,
        pieChartData
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">לוח בקרה</h1>
        <p className="text-muted-foreground font-noto">ברוכים הבאים לפאנל הניהול של מינרל גז</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Revenue - First Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₪{dashboardData?.totalRevenue.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData?.revenueChangePercent > 0 ? '+' : ''}{dashboardData?.revenueChangePercent || 0}% מהחודש שעבר
            </p>
          </CardContent>
        </Card>

        {/* Orders - Second Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הזמנות</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.ordersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.todayOrdersCount || 0} הזמנות חדשות היום
            </p>
          </CardContent>
        </Card>

        {/* Customers - Third Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.customersCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.newCustomersCount || 0} לקוחות חדשים החודש
            </p>
          </CardContent>
        </Card>

        {/* Products - Fourth Priority */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מוצרים</CardTitle>
            <Fuel className="h-4 w-4 text-bottle-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.productsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData?.newProductsCount || 0} מוצרים חדשים החודש
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>מגמת הכנסות והזמנות</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={{
                chart: {
                  id: 'revenue-chart',
                  fontFamily: 'inherit',
                  toolbar: {
                    show: false
                  },
                  animations: {
                    enabled: true,
                    speed: 800,
                  }
                },
                colors: ['#10b981', '#3b82f6'],
                dataLabels: {
                  enabled: false
                },
                stroke: {
                  curve: 'smooth',
                  width: 3
                },
                fill: {
                  type: 'gradient',
                  gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2,
                    stops: [0, 90, 100]
                  }
                },
                xaxis: {
                  categories: dashboardData?.revenueByMonth?.map(d => d.name) || [],
                  labels: {
                    style: {
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }
                  }
                },
                yaxis: {
                  labels: {
                    style: {
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }
                  }
                },
                legend: {
                  position: 'top',
                  horizontalAlign: 'right',
                  fontFamily: 'inherit',
                  fontSize: '14px'
                },
                grid: {
                  borderColor: '#e5e7eb',
                  strokeDashArray: 3
                },
                tooltip: {
                  theme: 'light',
                  style: {
                    fontSize: '12px',
                    fontFamily: 'inherit'
                  }
                }
              }}
              series={[
                {
                  name: 'הכנסות',
                  data: dashboardData?.revenueByMonth?.map(d => d.הכנסות) || []
                },
                {
                  name: 'הזמנות',
                  data: dashboardData?.revenueByMonth?.map(d => d.הזמנות) || []
                }
              ]}
              type="area"
              height={300}
            />
          </CardContent>
        </Card>

        {/* Products Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>מוצרים מובילים</CardTitle>
          </CardHeader>
          <CardContent>
            <Chart
              options={{
                chart: {
                  id: 'products-chart',
                  fontFamily: 'inherit',
                  toolbar: {
                    show: false
                  },
                  animations: {
                    enabled: true,
                    speed: 800,
                  }
                },
                colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
                plotOptions: {
                  bar: {
                    borderRadius: 8,
                    distributed: true,
                    horizontal: false,
                    columnWidth: '60%'
                  }
                },
                dataLabels: {
                  enabled: false
                },
                xaxis: {
                  categories: dashboardData?.pieChartData?.map(d => d.name) || [],
                  labels: {
                    style: {
                      fontSize: '11px',
                      fontFamily: 'inherit'
                    },
                    rotate: -45,
                    rotateAlways: false
                  }
                },
                yaxis: {
                  labels: {
                    style: {
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }
                  },
                  title: {
                    text: 'כמות הזמנות',
                    style: {
                      fontSize: '12px',
                      fontFamily: 'inherit'
                    }
                  }
                },
                legend: {
                  show: false
                },
                grid: {
                  borderColor: '#e5e7eb',
                  strokeDashArray: 3
                },
                tooltip: {
                  theme: 'light',
                  style: {
                    fontSize: '12px',
                    fontFamily: 'inherit'
                  },
                  y: {
                    formatter: (val) => `${val} הזמנות`
                  }
                }
              }}
              series={[
                {
                  name: 'הזמנות',
                  data: dashboardData?.pieChartData?.map(d => d.value) || []
                }
              ]}
              type="bar"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Query Assistant - Moved below charts */}
      <AIQueryAssistant />

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הזמנות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {dashboardData?.recentOrders?.length > 0 ? (
                dashboardData.recentOrders.map((order, index) => (
                  <div key={order.id} className="flex items-center">
                    <div className="mr-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{order.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        הזמנה #{String(order.id).slice(-3)} - {order.customerName}
                      </p>
                    </div>
                    <div className="mr-auto font-medium">₪{Number(order.total).toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">אין הזמנות אחרונות</div>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>מוצרים פופולריים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {dashboardData?.popularProducts?.length > 0 ? (
                dashboardData.popularProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center">
                    <div className="mr-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.count} הזמנות החודש
                      </p>
                    </div>
                    <div className="mr-auto font-medium">₪{product.price.toLocaleString()}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">אין מוצרים פופולריים</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Updates Management */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">ניהול עדכוני מערכת</h2>
        <SystemUpdatesManager />
      </div>
    </div>
  );
}
