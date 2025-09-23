import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyStat {
  month: string;
  order_count: number;
  total_amount: number;
}

interface MonthlySalesChartProps {
  loading: boolean;
  monthlyStats: MonthlyStat[];
}

const MonthlySalesChart = ({ loading, monthlyStats }: MonthlySalesChartProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMonth = (dateString: string) => {
    const [year, month] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    return new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>מכירות חודשיות</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : monthlyStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyStats}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                  tickFormatter={formatMonth}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'order_count') return [`${value} הזמנות`, 'מספר הזמנות'];
                    if (name === 'total_amount') return [formatCurrency(Number(value)), 'סכום כולל'];
                    return [value, name];
                  }}
                  labelFormatter={formatMonth}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="order_count" fill="#8884d8" name="מספר הזמנות" />
                <Bar yAxisId="right" dataKey="total_amount" fill="#82ca9d" name="סכום כולל" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlySalesChart; 