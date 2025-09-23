import { Card } from "@/components/ui/card";
import { OrderProduct } from "./orderConstants";
import { CheckCircle, Package2 as PackageIcon, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: OrderProduct;
  onSelect: (productId: string) => void;
  isSelected: boolean;
}

export default function ProductCard({ product, onSelect, isSelected }: ProductCardProps) {
  // קביעת טקסט יחידת המידה
  const unitText = product.is_frozen ? "קרטון" : "יחידה";
  
  // טקסט כמות בקרטון (רק למוצרים קפואים)
  const packageInfo = product.is_frozen && product.package_amount 
    ? `${product.package_amount} יח׳ בקרטון`
    : null;

  return (
    <Card 
      key={product.id}
      className={`overflow-hidden flex items-center border ${isSelected ? "border-green-500" : "border-gray-200"} cursor-pointer hover:bg-gray-50 relative`}
      onClick={() => onSelect(product.id)}
    >
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-24 h-24 object-cover"
      />
      <div className="flex-1 p-4 text-right">
        <h3 className="font-medium">{product.name}</h3>
        
        <div className="mt-1 flex items-center justify-end gap-2">
          <Badge variant={product.is_frozen ? "secondary" : "outline"} className="text-xs">
            {product.is_frozen ? (
              <PackageIcon className="h-3 w-3 mr-1" />
            ) : (
              <CircleDot className="h-3 w-3 mr-1" />
            )}
            {unitText}
          </Badge>
          
          {packageInfo && (
            <span className="text-xs text-gray-500">{packageInfo}</span>
          )}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute top-2 left-2">
          <CheckCircle className="h-6 w-6 text-green-500 fill-white" />
        </div>
      )}
    </Card>
  );
}
