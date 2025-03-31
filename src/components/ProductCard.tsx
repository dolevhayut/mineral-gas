
import { Product } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <Card className="overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      <div className="relative">
        <Link to={`/product/${product.id}`}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        </Link>
        {product.featured && (
          <Badge className="absolute top-2 right-2 bg-bakery-500 hover:bg-bakery-600">
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="pt-4 flex-grow">
        <Link to={`/product/${product.id}`} className="hover:underline">
          <h3 className="font-medium text-lg mb-1">{product.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>
        <p className="font-semibold text-lg">{formatCurrency(product.price)}</p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          onClick={() => addItem(product)}
          className="w-full bg-bakery-600 hover:bg-bakery-700"
          disabled={!product.available}
        >
          <ShoppingCartIcon className="h-4 w-4 mr-2" />
          {product.available ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
}
