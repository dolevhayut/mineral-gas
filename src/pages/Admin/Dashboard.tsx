
import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { sampleOrders, sampleProducts, sampleUsers, sampleCategories } from "@/lib/data";
import { BarChart3Icon, CakeIcon, ShoppingCartIcon, UsersIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const AdminDashboard = () => {
  const totalUsers = sampleUsers.length;
  const totalProducts = sampleProducts.length;
  const totalOrders = sampleOrders.length;
  const totalRevenue = sampleOrders.reduce((sum, order) => sum + order.total, 0);
  
  const ordersByStatus = [
    {
      name: "ממתין",
      count: sampleOrders.filter((order) => order.status === "pending").length,
    },
    {
      name: "בתהליך",
      count: sampleOrders.filter((order) => order.status === "processing").length,
    },
    {
      name: "הושלם",
      count: sampleOrders.filter((order) => order.status === "completed").length,
    },
    {
      name: "בוטל",
      count: sampleOrders.filter((order) => order.status === "cancelled").length,
    },
  ];

  const productsByCategory = sampleProducts.reduce((acc: any[], product) => {
    const categoryName = sampleCategories.find(
      (c) => c.id === product.category
    )?.name;
    
    const existingCategory = acc.find((item) => item.name === categoryName);
    
    if (existingCategory) {
      existingCategory.count += 1;
    } else {
      acc.push({
        name: categoryName,
        count: 1,
      });
    }
    
    return acc;
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-serif font-bold text-right">לוח בקרה</h1>
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">משתמשים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{totalUsers}</div>
              <p className="text-xs text-muted-foreground text-right">
                לקוחות ומנהלים רשומים
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CakeIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">מוצרים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{totalProducts}</div>
              <p className="text-xs text-muted-foreground text-right">
                מוצרים פעילים בקטלוג
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">הזמנות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{totalOrders}</div>
              <p className="text-xs text-muted-foreground text-right">
                הזמנות שבוצעו על ידי לקוחות
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">הכנסות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-right">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground text-right">
                הכנסות מכל ההזמנות
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-right">הזמנות לפי סטטוס</CardTitle>
              <CardDescription className="text-right">התפלגות סטטוס ההזמנות</CardDescription>
            </CardHeader>
            <CardContent className="h-80 ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#e96b2a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="text-right">מוצרים לפי קטגוריה</CardTitle>
              <CardDescription className="text-right">התפלגות מוצרים בקטגוריות</CardDescription>
            </CardHeader>
            <CardContent className="h-80 ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#c5a058" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
