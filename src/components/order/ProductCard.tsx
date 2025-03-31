
import { Card } from "@/components/ui/card";
import { OrderProduct } from "./orderConstants";

interface ProductCardProps {
  product: OrderProduct;
  onSelect: (productId: string) => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card 
      key={product.id}
      className="overflow-hidden flex items-center border border-gray-200 cursor-pointer"
      onClick={() => onSelect(product.id)}
    >
      <img 
        src={product.image} 
        alt={product.name} 
        className="w-24 h-24 object-cover"
      />
      <div className="flex-1 p-4 text-right">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-sm text-gray-500">{product.sku}</p>
      </div>
    </Card>
  );
}
