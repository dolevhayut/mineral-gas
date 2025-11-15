import { motion } from "framer-motion";
import { OrderProduct } from "./orderConstants";
import ProductCard from "./ProductCard";
import { sortProductsByName } from "./utils/orderUtils";

interface ProductsListProps {
  products: OrderProduct[];
  onSelectProduct: (productId: string, deliveryPreference?: {
    dayOfWeek?: number;
    date?: Date;
  } | 'increment' | 'decrement') => void;
  quantities: Record<string, number>;
  adminSelectedCustomer?: {id: string, name: string, phone: string, city?: string} | null;
}

export default function ProductsList({ products, onSelectProduct, quantities, adminSelectedCustomer }: ProductsListProps) {
  // Sort products by name
  const sortedProducts = sortProductsByName(products);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sortedProducts.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard 
            product={product} 
            onSelect={onSelectProduct}
            isSelected={(quantities[product.id] || 0) > 0}
            quantity={quantities[product.id] || 0}
            adminSelectedCustomer={adminSelectedCustomer}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
