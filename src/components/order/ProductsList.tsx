
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductsListProps {
  products: Product[];
  onSelectProduct: (productId: string) => void;
}

export default function ProductsList({ products, onSelectProduct }: ProductsListProps) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onSelect={onSelectProduct} 
        />
      ))}
    </div>
  );
}
