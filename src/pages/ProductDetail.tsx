
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { sampleProducts } from "@/lib/data";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ProductCard from "@/components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Find the product
    const foundProduct = sampleProducts.find((p) => p.id === id);
    if (foundProduct) {
      setProduct(foundProduct);
      
      // Get related products from the same category
      const related = sampleProducts
        .filter((p) => p.category === foundProduct.category && p.id !== id)
        .slice(0, 3);
      setRelatedProducts(related);
    } else {
      // Redirect if product not found
      navigate("/catalog");
    }
  }, [id, navigate]);

  const handleQuantityChange = (amount: number) => {
    const newQuantity = Math.max(1, quantity + amount);
    setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity);
    }
  };

  if (!product) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p>Loading product information...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            &larr; Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Product Image */}
          <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.featured && (
              <Badge className="absolute top-4 right-4 bg-bakery-500 hover:bg-bakery-600">
                Featured
              </Badge>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl font-serif font-bold mb-2">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold mb-4">
              {formatCurrency(product.price)}
            </p>

            <div className="prose prose-sm mb-6">
              <p>{product.description}</p>
            </div>

            <Separator className="mb-6" />

            <div className="space-y-6">
              {/* Availability */}
              <div>
                <div className="font-medium mb-1">Availability</div>
                {product.available ? (
                  <Badge variant="outline" className="border-green-500 text-green-600">
                    In Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500 text-red-600">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Quantity */}
              <div>
                <div className="font-medium mb-2">Quantity</div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <Button
                className="w-full bg-bakery-600 hover:bg-bakery-700"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.available}
              >
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-bold mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetail;
