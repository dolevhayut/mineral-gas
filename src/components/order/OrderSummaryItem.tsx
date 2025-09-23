import { OrderProduct } from "./orderConstants";
import { Package2 as PackageIcon, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderSummaryItemProps {
  product: OrderProduct;
  day: string;
  quantity: number;
  index: number;
}

export default function OrderSummaryItem({ product, day, quantity, index }: OrderSummaryItemProps) {
  // קביעת טקסט יחידת המידה
  const unitText = product.is_frozen ? "קרטון" : "יח׳";

  return (
    <div key={`${product.id}-${day}-${index}`} className="flex justify-between border-b pb-3 pt-2">
      <div className="text-left flex items-center">
        <span className="font-medium text-lg text-bakery-600">{quantity}×</span>
        <Badge variant="outline" className="text-xs ml-1">
          {product.is_frozen ? (
            <PackageIcon className="h-3 w-3 mr-1" />
          ) : (
            <CircleDot className="h-3 w-3 mr-1" />
          )}
          {unitText}
        </Badge>
      </div>
      <div className="text-right">
        <p className="font-medium">{product.name}</p>
        <p className="text-sm text-gray-500">יום: {getHebrewDayName(day)}</p>
      </div>
    </div>
  );
}

// Helper function to convert day ID to Hebrew day name
function getHebrewDayName(dayId: string): string {
  const dayMap: Record<string, string> = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי",
    saturday: "שבת",
  };
  return dayMap[dayId] || dayId;
}
