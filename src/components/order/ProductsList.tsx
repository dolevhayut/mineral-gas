
import { OrderProduct } from "./orderConstants";
import ProductCard from "./ProductCard";
import { sortProductsByName } from "./utils/orderUtils";

interface ProductsListProps {
  products: OrderProduct[];
  onSelectProduct: (productId: string, deliveryPreference?: {
    type: 'asap' | 'specific';
    date?: Date;
    time?: string;
  }) => void;
  quantities: Record<string, number>;
}

export default function ProductsList({ products, onSelectProduct, quantities }: ProductsListProps) {
  // Sort products by name
  const sortedProducts = sortProductsByName(products);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedProducts.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onSelect={onSelectProduct}
          isSelected={!!quantities[product.id] && quantities[product.id] > 0}
        />
      ))}
    </div>
  );
}
