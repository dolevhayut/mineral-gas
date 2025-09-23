import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductStat {
  product_id: string;
  product_name: string;
  total_ordered: number;
}

interface ProductsLeaderboardProps {
  loading: boolean;
  products: ProductStat[];
  title?: string;
}

const ProductsLeaderboard = ({ loading, products, title = "המוצרים שהזמנתי הכי הרבה" }: ProductsLeaderboardProps) => {
  const items = (products || []).slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין נתונים להצגה</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((p, idx) => (
              <div key={p.product_id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm w-6 text-muted-foreground">#{idx + 1}</span>
                  <span className="font-medium truncate max-w-[14rem]">{p.product_name}</span>
                </div>
                <div className="text-sm text-muted-foreground">{p.total_ordered} יח׳</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductsLeaderboard;


