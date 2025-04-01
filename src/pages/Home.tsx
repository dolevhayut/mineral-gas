import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { sampleProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { CakeIcon, CookieIcon, ShoppingBasketIcon, ThumbsUpIcon, BellIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";

interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_active: boolean;
  expiry_date?: string | null;
}

const Home = () => {
  const navigate = useNavigate();
  const featuredProducts = sampleProducts
    .filter(product => product.featured)
    .slice(0, 3);

  // Fetch active system updates
  const { data: systemUpdates } = useQuery({
    queryKey: ["system-updates-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_updates")
        .select("*")
        .eq("is_active", true)
        .or(`expiry_date.gt.${new Date().toISOString()},expiry_date.is.null`)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching system updates:", error);
        return [];
      }
      
      return data as SystemUpdate[];
    }
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: he });
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-cream-100 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-noto font-bold mb-4">
                <span className="text-bakery-600">מאפיית אורבר</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-xl mx-auto lg:mx-0 font-noto">
                טעמים מקוריים ואיכות ללא פשרות. מהמאפים הטריים ועד העוגות המיוחדות שלנו.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-bakery-600 hover:bg-bakery-700"
                  onClick={() => navigate("/catalog")}
                >
                  Browse Catalog
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-bakery-600 text-bakery-600 hover:bg-bakery-50"
                  onClick={() => navigate("/about")}
                >
                  Our Story
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <img
                src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Assorted Pastries"
                className="rounded-lg shadow-xl mx-auto max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* System Updates */}
      {systemUpdates && systemUpdates.length > 0 && (
        <section className="py-8 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-serif font-bold mb-4 text-center flex items-center justify-center">
              <BellIcon className="h-5 w-5 mr-2 text-bakery-600" />
              הודעות ועדכונים
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-3 mt-4">
                {systemUpdates.map((update) => (
                  <Card key={update.id} className="p-4 border-bakery-100 border-2">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">{update.title}</h3>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {formatDate(update.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{update.content}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif font-bold mb-2 text-center">
            Featured Treats
          </h2>
          <p className="text-center text-muted-foreground mb-8">
            Our most loved baked goods
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              onClick={() => navigate("/catalog")}
              variant="outline"
              size="lg"
              className="border-bakery-600 text-bakery-600 hover:bg-bakery-50"
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-cream-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-noto font-bold mb-8 text-center">
            למה לבחור במאפיית אורבר?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bakery-100 rounded-full text-bakery-600 mb-4">
                <CookieIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Fresh Daily</h3>
              <p className="text-muted-foreground">
                All our products are baked fresh every day
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bakery-100 rounded-full text-bakery-600 mb-4">
                <ThumbsUpIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Quality Ingredients</h3>
              <p className="text-muted-foreground">
                We use only the finest organic ingredients
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bakery-100 rounded-full text-bakery-600 mb-4">
                <ShoppingBasketIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">
                Get your order delivered to your doorstep
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bakery-100 rounded-full text-bakery-600 mb-4">
                <CakeIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">Custom Orders</h3>
              <p className="text-muted-foreground">
                Special occasions deserve special treats
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-bakery-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Ready to Order?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            Browse our catalog and order your favorite baked goods today
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-bakery-600 hover:bg-cream-100"
            onClick={() => navigate("/catalog")}
          >
            Browse Our Catalog
          </Button>
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
