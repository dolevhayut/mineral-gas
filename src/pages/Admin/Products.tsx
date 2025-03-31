import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  SearchIcon, 
  PencilIcon, 
  TrashIcon, 
  Loader2Icon,
  ImageIcon,
  XIcon,
  CheckIcon,
  XCircleIcon,
  FilterIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  sku: string;
  description: string;
  image: string;
  quantity_increment?: number;
  created_at: string;
  is_frozen?: boolean;
}

// Default image if product doesn't have one
const DEFAULT_IMAGE = '/placeholder-product.png';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({
    available: true,
    quantity_increment: 1,
    is_frozen: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, isLoading: isProductsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "שגיאה בטעינת מוצרים",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // If no products found, return mock data
      if (!data || data.length === 0) {
        return [
          {
            id: "demo-prod-1",
            name: "עוגת שוקולד",
            price: 120,
            category: "עוגות",
            available: true,
            sku: "CAKE001",
            description: "עוגת שוקולד עשירה וטעימה",
            image: "",
            quantity_increment: 1,
            created_at: new Date().toISOString()
          },
          {
            id: "demo-prod-2",
            name: "עוגת גבינה",
            price: 150,
            category: "עוגות",
            available: true,
            sku: "CAKE002",
            description: "עוגת גבינה קלאסית וקרמית",
            image: "",
            quantity_increment: 1,
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "demo-prod-3",
            name: "מארז קאפקייקס",
            price: 180,
            category: "קאפקייקס",
            available: false,
            sku: "CUP001",
            description: "מארז 12 קאפקייקס במגוון טעמים",
            image: "",
            quantity_increment: 12,
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
      }

      return data as Product[];
    },
  });

  // Save product mutation
  const saveProduct = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      setIsLoading(true);
      let imagePath = product.image;

      // Upload image if a new file was selected
      if (imageFile) {
        // Generate a unique file name
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('product_images')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product_images')
          .getPublicUrl(filePath);

        imagePath = publicUrl;
      }

      // Save to database
      if (product.id) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({ ...product, image: imagePath })
          .eq("id", product.id);

        if (error) throw error;
        return { ...product, image: imagePath };
      } else {
        // Create new product
        if (!product.name || product.price === undefined) {
          throw new Error("שם מוצר ומחיר הם שדות חובה");
        }

        const { error, data } = await supabase
          .from("products")
          .insert([{ ...product, image: imagePath }] as any)
          .select();

        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      setIsLoading(false);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: currentProduct.id ? "מוצר עודכן" : "מוצר נוסף",
        description: currentProduct.id ? "המוצר עודכן בהצלחה" : "המוצר נוסף בהצלחה",
      });
      resetForm();
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "שגיאה בשמירת מוצר",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await supabase
        .from("products")
        .select("image")
        .eq("id", id)
        .single();
        
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Delete image from storage if exists and not a URL from another source
      if (data?.image && data.image.includes('product_images')) {
        // Extract file name from URL
        const fileName = data.image.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('product_images')
            .remove([fileName]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "מוצר נמחק",
        description: "המוצר נמחק בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת מוצר",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle product availability mutation
  const toggleAvailability = useMutation({
    mutationFn: async ({ id, available }: { id: string; available: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ available })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון זמינות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get unique categories for filtering
  const categories = products 
    ? [...new Set(products.map((product) => product.category))]
    : [];

  const filteredProducts = products?.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק מוצר זה?")) {
      deleteProduct.mutate(id);
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    if (product.image) {
      setImagePreview(product.image);
    }
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentProduct({
      available: true,
      quantity_increment: 1,
      is_frozen: false,
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setCurrentProduct({ ...currentProduct, image: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול מוצרים</h1>
          <p className="text-muted-foreground">נהל את המוצרים בחנות שלך</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 ml-2" />
          מוצר חדש
        </Button>
      </div>

      {products && products[0]?.id.startsWith("demo-") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 font-medium">מוצגים נתוני דמו</p>
          <p className="text-yellow-600 text-sm">לא נמצאו מוצרים אמיתיים במסד הנתונים. הנתונים המוצגים הם לצורך הדגמה בלבד.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חפש לפי שם, מק״ט או קטגוריה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={filterCategory}
            onValueChange={setFilterCategory}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סנן לפי קטגוריה" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הקטגוריות</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isProductsLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts?.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative h-48 bg-gray-100">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-gray-100">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant={product.available ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleAvailability.mutate({
                      id: product.id,
                      available: !product.available
                    })}
                  >
                    {product.available ? "זמין" : "לא זמין"}
                  </Badge>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{product.name}</CardTitle>
                  <p className="text-xl font-bold">₪{product.price}</p>
                </div>
                <CardDescription className="flex justify-between">
                  <span>מק״ט: {product.sku}</span>
                  <Badge variant="outline">{product.category}</Badge>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-0">
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {product.description}
                  </p>
                )}
                {product.quantity_increment && product.quantity_increment > 1 && (
                  <p className="text-sm font-medium">
                    קפיצות כמות: {product.quantity_increment}
                  </p>
                )}
                <p className="text-sm font-medium flex items-center mt-1">
                  <Badge variant={product.is_frozen ? "secondary" : "default"} className="mr-1">
                    {product.is_frozen ? "קפוא" : "טרי"}
                  </Badge>
                </p>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(product)}
                >
                  <PencilIcon className="h-4 w-4 ml-2" />
                  עריכה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(product.id)}
                >
                  <TrashIcon className="h-4 w-4 ml-2" />
                  מחיקה
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {filteredProducts?.length === 0 && !isProductsLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl font-medium text-muted-foreground">לא נמצאו מוצרים</p>
          <p className="text-sm text-muted-foreground mb-6">נסה לשנות את החיפוש או להוסיף מוצרים חדשים</p>
          <Button onClick={handleAddNew}>
            <PlusIcon className="h-4 w-4 ml-2" />
            הוסף מוצר חדש
          </Button>
        </div>
      )}

      {/* Product Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProduct.id ? "עריכת מוצר" : "הוספת מוצר חדש"}</DialogTitle>
            <DialogDescription>
              {currentProduct.id 
                ? "ערוך את פרטי המוצר ולחץ שמור כדי לעדכן"
                : "הזן את פרטי המוצר החדש ולחץ שמור כדי להוסיף"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם המוצר</Label>
              <Input
                id="name"
                value={currentProduct.name || ""}
                onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sku">מק״ט</Label>
              <Input
                id="sku"
                value={currentProduct.sku || ""}
                onChange={(e) => setCurrentProduct({ ...currentProduct, sku: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">מחיר</Label>
                <Input
                  id="price"
                  type="number"
                  value={currentProduct.price || ""}
                  onChange={(e) => setCurrentProduct({ 
                    ...currentProduct, 
                    price: parseFloat(e.target.value) 
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity_increment">קפיצות כמות</Label>
                <Input
                  id="quantity_increment"
                  type="number"
                  value={currentProduct.quantity_increment || 1}
                  onChange={(e) => setCurrentProduct({ 
                    ...currentProduct, 
                    quantity_increment: parseInt(e.target.value) || 1
                  })}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Input
                id="category"
                value={currentProduct.category || ""}
                onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">תיאור</Label>
              <Textarea
                id="description"
                value={currentProduct.description || ""}
                onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="available">זמינות</Label>
              <Select 
                value={currentProduct.available ? "true" : "false"}
                onValueChange={(value) => setCurrentProduct({ 
                  ...currentProduct, 
                  available: value === "true" 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר זמינות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">זמין</SelectItem>
                  <SelectItem value="false">לא זמין</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="is_frozen">סוג מוצר</Label>
              <Select 
                value={currentProduct.is_frozen ? "true" : "false"}
                onValueChange={(value) => setCurrentProduct({ 
                  ...currentProduct, 
                  is_frozen: value === "true" 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג מוצר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">טרי</SelectItem>
                  <SelectItem value="true">קפוא</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label>תמונת מוצר</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-32 w-32 rounded-md overflow-hidden bg-gray-100">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-gray-100">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full sm:w-auto"
                    >
                      בחר תמונה
                    </Button>
                  </div>
                  {imagePreview && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={handleRemoveImage}
                      className="w-full sm:w-auto"
                    >
                      <XIcon className="h-4 w-4 ml-2" />
                      הסר תמונה
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ביטול
            </Button>
            <Button 
              onClick={() => saveProduct.mutate(currentProduct)}
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 