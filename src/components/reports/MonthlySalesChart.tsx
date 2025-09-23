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
        <CardTitle>פעילות חודשית</CardTitle>
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
          <div className="w-full" style={{ height: `${monthlyStats.length * 80 + 60}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={monthlyStats}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" xAxisId="left" orientation="top" stroke="#8884d8" />
                <XAxis type="number" xAxisId="right" orientation="top" stroke="#82ca9d" />
                <YAxis
                  type="category"
                  dataKey="month"
                  tickFormatter={formatMonth}
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'order_count') return [`${value} הזמנות`, 'הזמנות שלי'];
                    if (name === 'total_amount') return [formatCurrency(Number(value)), 'הוצאות שלי'];
                    return [value, name];
                  }}
                  labelFormatter={formatMonth}
                />
                <Legend />
                <Bar xAxisId="left" dataKey="order_count" fill="#8884d8" name="הזמנות שלי" barSize={15} />
                <Bar xAxisId="right" dataKey="total_amount" fill="#82ca9d" name="הוצאות שלי" barSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MonthlySalesChart; 