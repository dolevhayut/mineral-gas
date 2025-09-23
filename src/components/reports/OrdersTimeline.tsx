import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid, Line } from "recharts";

interface OrdersTimelinePoint {
  date: string; // YYYY-MM-DD
  count: number;
}

interface OrdersTimelineProps {
  loading: boolean;
  title?: string;
  data: OrdersTimelinePoint[];
}

const formatDateShort = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" }).format(dt);
};

const OrdersTimeline = ({ loading, title = "ציר זמן הזמנות", data }: OrdersTimelineProps) => {
  // Build 7-day moving average for a visible trend line
  const windowSize = Math.min(7, Math.max(1, data.length));
  let movingSum = 0;
  const chartData = data.map((point, idx) => {
    movingSum += point.count;
    if (idx >= windowSize) {
      movingSum -= data[idx - windowSize].count;
    }
    const denom = idx + 1 < windowSize ? idx + 1 : windowSize;
    const avg = movingSum / denom;
    return { ...point, avg };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-[20px] w-full" />
            <Skeleton className="h-[220px] w-full" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals width={28} tick={{ fontSize: 12 }} domain={[0, "dataMax + 1"]} />
                <Tooltip labelFormatter={(v) => formatDateShort(String(v))} />
                <Area type="monotone" dataKey="count" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                <Line type="monotone" dataKey="avg" stroke="#0ea5e9" strokeWidth={2} dot={false} name="קו מגמה" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrdersTimeline;


