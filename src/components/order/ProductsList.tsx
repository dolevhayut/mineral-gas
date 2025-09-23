
import { OrderProduct } from "./orderConstants";
import ProductCard from "./ProductCard";
import { sortProductsByVawoCode } from "./utils/orderUtils";

interface ProductsListProps {
  products: OrderProduct[];
  onSelectProduct: (productId: string) => void;
  quantities: Record<string, Record<string, number>>;
}

export default function ProductsList({ products, onSelectProduct, quantities }: ProductsListProps) {
  // Sort products by VAWO code using utility function
  const sortedProducts = sortProductsByVawoCode(products);

  return (
    <div className="space-y-4">
      {sortedProducts.map((product) => (
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
