import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryStatsProps {
  loading: boolean;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalCustomers: number;
}

const SummaryStats = ({
  loading,
  totalOrders,
  totalRevenue,
  averageOrderValue,
  totalCustomers,
}: SummaryStatsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סה"כ הזמנות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{totalOrders}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">ממוצע להזמנה</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">סה"כ לקוחות</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <div className="text-2xl font-bold">{totalCustomers}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryStats; 