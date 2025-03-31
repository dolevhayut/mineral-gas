
import { OrderProduct } from "./orderConstants";
import ProductCard from "./ProductCard";

interface ProductsListProps {
  products: OrderProduct[];
  onSelectProduct: (productId: string) => void;
  quantities: Record<string, Record<string, number>>;
}

export default function ProductsList({ products, onSelectProduct, quantities }: ProductsListProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onSelect={onSelectProduct}
          isSelected={!!quantities[product.id] && Object.values(quantities[product.id]).some(qty => qty > 0)}
        />
      ))}
    </div>
  );
}
