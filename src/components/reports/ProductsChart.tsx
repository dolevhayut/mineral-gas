import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ProductStat {
  product_id: string;
  product_name: string;
  total_ordered: number;
  revenue?: number;
}

interface ProductsChartProps {
  loading: boolean;
  products: ProductStat[];
  showRevenue?: boolean;
}

const ProductsChart = ({ loading, products, showRevenue = false }: ProductsChartProps) => {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
        <CardTitle>מוצרים פופולריים</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={products}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="product_name" 
                  angle={-45} 
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                {showRevenue && <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />}
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'total_ordered') return [`${value} יחידות`, 'כמות שהוזמנה'];
                    if (name === 'revenue') return [formatCurrency(Number(value)), 'הכנסות'];
                    return [value, name];
                  }}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="total_ordered" 
                  fill="#8884d8" 
                  name="כמות שהוזמנה"
                >
                  {products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                {showRevenue && (
                  <Bar 
                    yAxisId="right" 
                    dataKey="revenue" 
                    fill="#82ca9d" 
                    name="הכנסות" 
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsChart; 