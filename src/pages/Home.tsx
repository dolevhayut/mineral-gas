import MainLayout from "@/components/MainLayout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { sampleProducts } from "@/lib/data";
import ProductCard from "@/components/ProductCard";
import { FlameIcon, WrenchIcon, ShoppingBasketIcon, ThumbsUpIcon, BellIcon, PhoneIcon, MapPinIcon, ClockIcon, Wrench, RotateCcwIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import SEOHead from "@/components/SEOHead";

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
  // Business structured data for SEO
  const businessStructuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "מינרל גז - אביגל טורג'מן",
    "description": "שירות מקצועי למכירת בלוני גז, מחממי מים על גז, ציוד היקפי להתקנות ושירות לקוחות מעולה",
    "url": "https://mineral-gas.com",
    "telephone": "+972-XX-XXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IL",
      "addressLocality": "ישראל"
    },
    "openingHours": "Mo-Fr 08:00-17:00, Sa 08:00-14:00",
    "priceRange": "$$",
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": 31.7683,
        "longitude": 35.2137
      },
      "geoRadius": "50000"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "מוצרי גז וחימום",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "בלוני גז"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "מחממי מים על גז"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Product",
            "name": "ציוד היקפי להתקנות"
          }
        }
      ]
    }
  };

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
    <>
      <SEOHead
        title="מינרל גז - אביגל טורג'מן | בלוני גז ומוצרי חימום"
        description="מינרל גז - שירות מקצועי למכירת בלוני גז, מחממי מים על גז, ציוד היקפי להתקנות ושירות לקוחות מעולה. אביגל טורג'מן - הפתרון שלך לחימום ביתי."
        keywords="בלוני גז, מחממי מים, חימום, גז, אביגל טורג'מן, מינרל גז, ציוד היקפי, התקנות גז, שירות לקוחות"
        canonical="https://mineral-gas.com"
        structuredData={businessStructuredData}
      />
      <MainLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-bottle-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-right">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-bottle-600">מינרל גז</span>
                <br />
                <span className="text-2xl md:text-3xl lg:text-4xl text-stone-700">אביגל טורג'מן</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-stone-600 max-w-xl mx-auto lg:mx-0">
                שירות מקצועי למכירת בלוני גז, מחממי מים על גז, ציוד היקפי להתקנות ושירות לקוחות מעולה. הפתרון שלך לחימום ביתי.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-end">
                <Button
                  size="lg"
                  className="bg-bottle-600 hover:bg-bottle-700 text-white"
                  onClick={() => navigate("/orders/new")}
                >
                  הזמנה חדשה
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-bottle-600 text-bottle-600 hover:bg-bottle-50"
                  onClick={() => navigate("/orders/new")}
                >
                  הזמן עכשיו
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                  onClick={() => navigate("/service-request")}
                >
                  <Wrench className="h-5 w-5" />
                  קריאת שירות
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
                  onClick={() => navigate("/orders/history")}
                >
                  <RotateCcwIcon className="h-5 w-5" />
                  הזמנה חוזרת
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <img
                src="/assets/gas-cylinder-hero.jpg"
                alt="בלוני גז ומוצרי חימום - מינרל גז"
                className="rounded-lg shadow-xl mx-auto max-w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
                }}
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
              <BellIcon className="h-5 w-5 mr-2 text-bottle-600" />
              הודעות ועדכונים
            </h2>
            <div className="max-w-3xl mx-auto">
              <div className="space-y-3 mt-4">
                {systemUpdates.map((update) => (
                  <Card key={update.id} className="p-4 border-bottle-100 border-2">
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
            <h2 className="text-3xl font-bold mb-2 text-center">
              מוצרים מומלצים
            </h2>
            <p className="text-center text-stone-600 mb-8">
              המוצרים הפופולריים ביותר שלנו לבלוני גז וחימום
            </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              onClick={() => navigate("/orders/new")}
              variant="outline"
              size="lg"
              className="border-bottle-600 text-bottle-600 hover:bg-bottle-50"
            >
              הזמנה חדשה
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Service Request */}
      <section className="py-12 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              זקוק לעזרה? אנחנו כאן בשבילך!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              בעיה עם מחמם המים? בלון גז לא עובד? צור קשר איתנו עכשיו
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                onClick={() => navigate("/service-request")}
              >
                <Wrench className="h-5 w-5" />
                פתח קריאת שירות
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-orange-600 text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                onClick={() => window.open('tel:050-1234567')}
              >
                <PhoneIcon className="h-5 w-5" />
                התקשר עכשיו: 050-1234567
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-bottle-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">
            למה לבחור במינרל גז?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bottle-100 rounded-full text-bottle-600 mb-4">
                <FlameIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">בלוני גז איכותיים</h3>
              <p className="text-stone-600">
                בלוני גז מאושרים ובטיחותיים לכל שימוש ביתי
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full text-amber-600 mb-4">
                <WrenchIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">התקנה מקצועית</h3>
              <p className="text-stone-600">
                שירות התקנה מקצועי ומחממי מים על גז
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-bottle-100 rounded-full text-bottle-600 mb-4">
                <ShoppingBasketIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">משלוח מהיר</h3>
              <p className="text-stone-600">
                משלוח מהיר ואמין עד הבית
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="mx-auto w-12 h-12 flex items-center justify-center bg-amber-100 rounded-full text-amber-600 mb-4">
                <ThumbsUpIcon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-medium mb-2">שירות לקוחות מעולה</h3>
              <p className="text-stone-600">
                שירות לקוחות מקצועי ואמין 24/7
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-bottle-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            מוכנים להזמין?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            צפו בקטלוג המוצרים שלנו והזמינו את בלוני הגז והחימום שלכם היום
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-bottle-600 hover:bg-stone-100"
              onClick={() => navigate("/orders/new")}
            >
              הזמנה חדשה
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-bottle-600"
              onClick={() => navigate("/orders/new")}
            >
              הזמן עכשיו
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-12 bg-stone-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <PhoneIcon className="h-8 w-8 text-bottle-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">טלפון</h3>
              <p className="text-stone-600">+972-XX-XXXXXXX</p>
            </div>
            <div className="flex flex-col items-center">
              <MapPinIcon className="h-8 w-8 text-amber-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">כתובת</h3>
              <p className="text-stone-600">ישראל</p>
            </div>
            <div className="flex flex-col items-center">
              <ClockIcon className="h-8 w-8 text-bottle-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">שעות פעילות</h3>
              <p className="text-stone-600">א׳-ה׳ 08:00-17:00</p>
              <p className="text-stone-600">ו׳ 08:00-14:00</p>
            </div>
          </div>
        </div>
      </section>
      </MainLayout>
    </>
  );
};

export default Home;
