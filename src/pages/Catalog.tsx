
import { useState, useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import ProductCard from "@/components/ProductCard";
import { sampleProducts, sampleCategories } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, FilterIcon } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product } from "@/types";
import SEOHead from "@/components/SEOHead";

const Catalog = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get("category");

  const [products, setProducts] = useState(sampleProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  const [sortBy, setSortBy] = useState("default");

  // Product catalog structured data for SEO
  const catalogStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "קטלוג מוצרים - מינרל גז",
    "description": "קטלוג מוצרים מקיף לבלוני גז, מחממי מים על גז וציוד היקפי",
    "url": "https://mineral-gas.com/catalog",
    "mainEntity": {
      "@type": "ItemList",
      "name": "מוצרי גז וחימום",
      "itemListElement": sampleProducts.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": product.name,
          "description": product.description,
          "image": product.image,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "ILS"
          }
        }
      }))
    }
  };

  // Filter products based on search and category
  useEffect(() => {
    let filteredProducts = [...sampleProducts];

    if (searchTerm) {
      filteredProducts = filteredProducts.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      const categoryId = sampleCategories.find(
        (c) => c.name === selectedCategory
      )?.id;
      if (categoryId) {
        filteredProducts = filteredProducts.filter(
          (product) => product.category === categoryId
        );
      }
    }

    // Sort products
    switch (sortBy) {
      case "price-asc":
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Default sorting - featured items first
        filteredProducts.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setProducts(filteredProducts);
  }, [searchTerm, selectedCategory, sortBy]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory(null);
    setSortBy("default");
  };

  return (
    <>
      <SEOHead
        title="קטלוג מוצרים - מינרל גז | בלוני גז ומוצרי חימום"
        description="קטלוג מוצרים מקיף לבלוני גז, מחממי מים על גז וציוד היקפי. מינרל גז - אביגל טורג'מן מציעה מגוון רחב של מוצרי חימום איכותיים."
        keywords="קטלוג מוצרים, בלוני גז, מחממי מים, חימום, גז, אביגל טורג'מן, מינרל גז, ציוד היקפי, התקנות גז"
        canonical="https://mineral-gas.com/catalog"
        structuredData={catalogStructuredData}
      />
      <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">מוצרי מינרל גז</h1>
          <p className="text-stone-600 max-w-2xl">
            צפו במגוון הרחב של מוצרי הגז והחימום שלנו - בלוני גז איכותיים, מחממי מים על גז, 
            ציוד היקפי להתקנות ושירות מקצועי. הפתרון המושלם לכל צרכי החימום שלכם.
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="חיפוש מוצרים..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="md:col-span-3">
              <Select 
                value={selectedCategory || ""} 
                onValueChange={(value) => setSelectedCategory(value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="כל הקטגוריות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">כל הקטגוריות</SelectItem>
                  {sampleCategories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="מיון לפי" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">מומלצים</SelectItem>
                  <SelectItem value="price-asc">מחיר: נמוך לגבוה</SelectItem>
                  <SelectItem value="price-desc">מחיר: גבוה לנמוך</SelectItem>
                  <SelectItem value="name-asc">שם: א-ת</SelectItem>
                  <SelectItem value="name-desc">שם: ת-א</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-1">
              <Button 
                variant="outline" 
                className="w-full h-full" 
                onClick={resetFilters}
              >
                איפוס
              </Button>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-stone-600">
            מציג {products.length} מוצרים
            {selectedCategory && ` בקטגוריית ${selectedCategory}`}
            {searchTerm && ` התואמים ל"${searchTerm}"`}
          </p>
        </div>

        {/* Products Grid */}
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-2xl font-medium mb-4">לא נמצאו מוצרים</p>
              <p className="text-stone-600 mb-6">
                נסו להתאים את החיפוש או קריטריוני הסינון
              </p>
              <Button onClick={resetFilters}>נקה מסננים</Button>
            </div>
          )}
        </div>
      </div>
      </MainLayout>
    </>
  );
};

export default Catalog;
