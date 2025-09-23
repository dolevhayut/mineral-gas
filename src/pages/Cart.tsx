
import { useState } from "react";
import MainLayout from "@/components/MainLayout";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { MinusIcon, PlusIcon, ShoppingCartIcon, TrashIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Cart = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to checkout");
      navigate("/login");
      return;
    }
    
    // For demo purposes, we'll just show a success message
    toast.success("Order placed successfully!");
    clearCart();
    navigate("/orders");
  };

  if (items.length === 0) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingCartIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-3xl font-serif font-bold mb-4">Your Cart is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button 
              onClick={() => navigate("/catalog")} 
              className="bg-bottle-600 hover:bg-bottle-700"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif font-bold mb-6">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Header */}
              <div className="hidden sm:grid grid-cols-12 bg-muted p-4 text-sm font-medium">
                <div className="col-span-6">Product</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {/* Items */}
              <div className="divide-y">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="grid sm:grid-cols-12 gap-4 p-4 items-center"
                  >
                    {/* Product Image and Name */}
                    <div className="sm:col-span-6 flex items-center">
                      <div className="w-16 h-16 flex-shrink-0 mr-4">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                      <div>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="font-medium hover:text-bottle-600 hover:underline"
                        >
                          {item.product.name}
                        </Link>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="sm:col-span-2 text-center">
                      <div className="sm:hidden text-sm text-muted-foreground mb-1">
                        Price:
                      </div>
                      {formatCurrency(item.product.price)}
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2 flex items-center sm:justify-center">
                      <div className="sm:hidden text-sm text-muted-foreground mr-2">
                        Quantity:
                      </div>
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <MinusIcon className="h-3 w-3" />
                        </Button>
                        <span className="mx-2 w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <PlusIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Total and Remove */}
                    <div className="sm:col-span-2 flex justify-between sm:justify-end items-center">
                      <div className="sm:hidden text-sm text-muted-foreground mr-2">
                        Total:
                      </div>
                      <div className="font-medium">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 ml-4"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Actions */}
              <div className="p-4 border-t flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/catalog")}
                >
                  Continue Shopping
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => clearCart()}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-medium mb-4">Order Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Items ({totalItems})</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Taxes and shipping calculated at checkout
                  </p>
                </div>
                
                <Button
                  className="w-full mt-6 bg-bottle-600 hover:bg-bottle-700"
                  size="lg"
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cart;
