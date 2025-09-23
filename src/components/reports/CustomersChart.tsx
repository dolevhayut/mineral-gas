import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface CustomerStat {
  customer_id: string;
  customer_name: string;
  order_count: number;
  total_amount: number;
  avg_order_amount?: number;
}

interface CustomersChartProps {
  loading: boolean;
  customers: CustomerStat[];
  viewType?: 'bar' | 'pie';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

const CustomersChart = ({ loading, customers, viewType = 'bar' }: CustomersChartProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>לקוחות מובילים</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : viewType === 'bar' ? (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customers}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="customer_name" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'order_count') return [`${value} הזמנות`, 'מספר הזמנות'];
                    if (name === 'total_amount') return [formatCurrency(Number(value)), 'סכום כולל'];
                    return [value, name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="order_count" fill="#8884d8" name="מספר הזמנות" />
                <Bar yAxisId="right" dataKey="total_amount" fill="#82ca9d" name="סכום כולל" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customers}
                  dataKey="total_amount"
                  nameKey="customer_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomersChart; 