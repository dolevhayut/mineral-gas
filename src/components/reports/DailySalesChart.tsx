import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailySalesStat {
  date: string;
  order_count: number;
  total_amount: number;
}

interface DailySalesChartProps {
  loading: boolean;
  dailySales: DailySalesStat[];
}

const DailySalesChart = ({ loading, dailySales }: DailySalesChartProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric' }).format(date);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>מכירות יומיות</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : dailySales.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailySales}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'order_count') return [`${value} הזמנות`, 'מספר הזמנות'];
                    if (name === 'total_amount') return [formatCurrency(Number(value)), 'סכום כולל'];
                    return [value, name];
                  }}
                  labelFormatter={formatDate}
                />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="order_count" 
                  stroke="#8884d8" 
                  name="מספר הזמנות" 
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="total_amount" 
                  stroke="#82ca9d" 
                  name="סכום כולל" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailySalesChart; 