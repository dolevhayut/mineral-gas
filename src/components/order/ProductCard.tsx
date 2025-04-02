import { Card } from "@/components/ui/card";
import { OrderProduct } from "./orderConstants";
import { CheckCircle } from "lucide-react";

interface ProductCardProps {
  product: OrderProduct;
  onSelect: (productId: string) => void;
  isSelected: boolean;
}

export default function ProductCard({ product, onSelect, isSelected }: ProductCardProps) {
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
      </div>
      
      {isSelected && (
        <div className="absolute top-2 left-2">
          <CheckCircle className="h-6 w-6 text-green-500 fill-white" />
        </div>
      )}
    </Card>
  );
}
