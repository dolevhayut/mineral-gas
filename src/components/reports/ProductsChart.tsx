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
        <CardTitle>המוצרים שהזמנתי הכי הרבה</CardTitle>
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
          <div className="w-full" style={{ height: `${Math.max(240, products.length * 50 + 60)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={products}
                margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  width={150}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'total_ordered') return [`${value} יחידות`, 'כמות שהזמנתי'];
                    if (name === 'revenue') return [formatCurrency(Number(value)), 'הוצאות'];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="total_ordered"
                  name="כמות שהזמנתי"
                  barSize={20}
                >
                  {products.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
                {showRevenue && (
                  <Bar
                    dataKey="revenue"
                    name="הוצאות"
                    fill="#82ca9d"
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