import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  PencilIcon, 
  Loader2Icon,
  RefreshCwIcon,
  DollarSignIcon,
  PackageIcon,
  CheckIcon,
  XIcon
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

interface PriceList {
  id: string;
  name: string;
  description?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  sku?: string | null;
}

interface PriceListItem {
  id: string;
  price_list_id: string;
  product_id: string;
  price: number;
}

interface ProductPrice {
  product: Product;
  customPrice?: number;
  priceListItemId?: string;
}

export default function PriceLists() {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditNameDialogOpen, setIsEditNameDialogOpen] = useState(false);
  const [currentPriceList, setCurrentPriceList] = useState<PriceList | null>(null);
  const [editingPriceList, setEditingPriceList] = useState<Partial<PriceList>>({});
  const [productPrices, setProductPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch price lists
  const { data: priceLists, isLoading: isPriceListsLoading } = useQuery({
    queryKey: ["price_lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_lists")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast({
          title: "שגיאה בטעינת מחירונים",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as PriceList[];
    },
  });

  // Fetch all products
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching products:", error);
        return [];
      }

      return data as Product[];
    },
  });

  // Fetch price list items for current price list
  const { data: priceListItems } = useQuery({
    queryKey: ["price_list_items", currentPriceList?.id],
    queryFn: async () => {
      if (!currentPriceList?.id) return [];

      const { data, error } = await supabase
        .from("price_list_items")
        .select("*")
        .eq("price_list_id", currentPriceList.id);

      if (error) {
        console.error("Error fetching price list items:", error);
        return [];
      }

      return data as PriceListItem[];
    },
    enabled: !!currentPriceList?.id,
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["price_lists"] })
      .then(() => {
        toast({
          title: "רשימת המחירונים עודכנה",
          duration: 2000,
        });
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  };

  // Handle edit price list
  const handleEditPriceList = (priceList: PriceList) => {
    setCurrentPriceList(priceList);
    setIsEditDialogOpen(true);
    
    // Fetch price list items and set initial prices
    queryClient.invalidateQueries({ queryKey: ["price_list_items", priceList.id] });
  };

  // Handle edit price list name
  const handleEditPriceListName = (priceList: PriceList) => {
    setEditingPriceList({
      id: priceList.id,
      name: priceList.name,
      description: priceList.description || "",
    });
    setIsEditNameDialogOpen(true);
  };

  // Update productPrices when priceListItems change
  useState(() => {
    if (priceListItems) {
      const prices: Record<string, number> = {};
      priceListItems.forEach((item) => {
        prices[item.product_id] = item.price;
      });
      setProductPrices(prices);
    }
  });

  // Update price list name
  const updatePriceListName = useMutation({
    mutationFn: async () => {
      if (!editingPriceList.id) return;

      setIsLoading(true);

      const { error } = await supabase
        .from("price_lists")
        .update({
          name: editingPriceList.name,
          description: editingPriceList.description,
        })
        .eq("id", editingPriceList.id);

      if (error) throw error;

      return true;
    },
    onSuccess: () => {
      setIsLoading(false);
      toast({
        title: "שם המחירון עודכן בהצלחה",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["price_lists"] });
      setIsEditNameDialogOpen(false);
      setEditingPriceList({});
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "שגיאה בעדכון שם המחירון",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Save price list items
  const savePriceListItems = useMutation({
    mutationFn: async () => {
      if (!currentPriceList?.id) return;

      setIsLoading(true);

      // Get existing price list items
      const existingItems = priceListItems || [];
      
      // Prepare updates and inserts
      const updates: Array<Promise<any>> = [];
      const inserts: any[] = [];

      Object.entries(productPrices).forEach(([productId, price]) => {
        const existingItem = existingItems.find(item => item.product_id === productId);
        
        if (existingItem) {
          // Update existing item - wrap in Promise.resolve to ensure it's a proper Promise
          updates.push(
            Promise.resolve(
              supabase
                .from("price_list_items")
                .update({ price })
                .eq("id", existingItem.id)
            )
          );
        } else {
          // Insert new item
          inserts.push({
            price_list_id: currentPriceList.id,
            product_id: productId,
            price,
          });
        }
      });

      // Delete items that are no longer in productPrices
      const deletions = existingItems
        .filter(item => !productPrices[item.product_id])
        .map(item => 
          Promise.resolve(
            supabase
              .from("price_list_items")
              .delete()
              .eq("id", item.id)
          )
        );

      // Execute all operations
      await Promise.all([...updates, ...deletions]);
      
      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("price_list_items")
          .insert(inserts);
        
        if (insertError) throw insertError;
      }

      return true;
    },
    onSuccess: () => {
      setIsLoading(false);
      toast({
        title: "המחירון עודכן בהצלחה",
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ["price_lists"] });
      queryClient.invalidateQueries({ queryKey: ["price_list_items"] });
      setIsEditDialogOpen(false);
      setCurrentPriceList(null);
      setProductPrices({});
    },
    onError: (error: any) => {
      setIsLoading(false);
      toast({
        title: "שגיאה בעדכון המחירון",
        description: error.message,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  // Get product prices for display
  const getProductPricesForDisplay = (): ProductPrice[] => {
    if (!products) return [];

    return products.map((product) => {
      const customPrice = productPrices[product.id];
      const priceListItem = priceListItems?.find(item => item.product_id === product.id);

      return {
        product,
        customPrice: customPrice !== undefined ? customPrice : priceListItem?.price,
        priceListItemId: priceListItem?.id,
      };
    });
  };

  // Handle price change
  const handlePriceChange = (productId: string, value: string) => {
    if (value === "") {
      // Remove custom price
      const newPrices = { ...productPrices };
      delete newPrices[productId];
      setProductPrices(newPrices);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setProductPrices({
          ...productPrices,
          [productId]: numValue,
        });
      }
    }
  };

  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "לא זמין";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול מחירונים</h1>
          <p className="text-muted-foreground">נהל מחירים שונים למוצרים עבור לקוחות שונים</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            className="flex-1 sm:flex-auto"
            disabled={isRefreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 ml-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>
      </div>

      {isPriceListsLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceLists?.map((priceList) => (
            <Card key={priceList.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{priceList.name}</span>
                  {priceList.is_default && (
                    <Badge variant="secondary">ברירת מחדל</Badge>
                  )}
                </CardTitle>
                {priceList.description && (
                  <CardDescription>{priceList.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">נוצר:</span>
                    <span>{formatDate(priceList.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">עודכן:</span>
                    <span>{formatDate(priceList.updated_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleEditPriceList(priceList)}
                    className="flex-1"
                    variant="default"
                  >
                    <DollarSignIcon className="h-4 w-4 ml-2" />
                    ערוך מחירים
                  </Button>
                  <Button 
                    onClick={() => handleEditPriceListName(priceList)}
                    variant="outline"
                    size="icon"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Price List Name Dialog */}
      <Dialog open={isEditNameDialogOpen} onOpenChange={setIsEditNameDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>עריכת שם מחירון</DialogTitle>
            <DialogDescription>
              ערוך את שם ותיאור המחירון
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם המחירון</Label>
              <Input
                id="name"
                placeholder="הכנס שם מחירון"
                value={editingPriceList.name || ""}
                onChange={(e) => setEditingPriceList({ ...editingPriceList, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">תיאור</Label>
              <Input
                id="description"
                placeholder="הכנס תיאור (אופציונלי)"
                value={editingPriceList.description || ""}
                onChange={(e) => setEditingPriceList({ ...editingPriceList, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsEditNameDialogOpen(false);
                setEditingPriceList({});
              }}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              onClick={() => updatePriceListName.mutate()}
              disabled={isLoading || !editingPriceList.name}
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Price List Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>עריכת מחירים - {currentPriceList?.name}</DialogTitle>
            <DialogDescription>
              ערוך את המחירים המותאמים אישית למוצרים במחירון זה. השאר ריק כדי להשתמש במחיר ברירת המחדל.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>מוצר</TableHead>
                  <TableHead>מק"ט</TableHead>
                  <TableHead>קטגוריה</TableHead>
                  <TableHead>מחיר ברירת מחדל</TableHead>
                  <TableHead>מחיר מותאם אישית</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getProductPricesForDisplay().map(({ product, customPrice }) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.sku || '-'}</TableCell>
                    <TableCell>{product.category || '-'}</TableCell>
                    <TableCell>₪{product.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={`${product.price.toFixed(2)}`}
                          value={customPrice !== undefined ? customPrice : ""}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          className="w-32"
                        />
                        {customPrice !== undefined && customPrice !== product.price && (
                          <Badge variant={customPrice < product.price ? "default" : "destructive"}>
                            {customPrice < product.price ? (
                              <>
                                <CheckIcon className="h-3 w-3 ml-1" />
                                זול יותר
                              </>
                            ) : (
                              <>
                                <XIcon className="h-3 w-3 ml-1" />
                                יקר יותר
                              </>
                            )}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setCurrentPriceList(null);
                setProductPrices({});
              }}
            >
              ביטול
            </Button>
            <Button 
              type="submit" 
              onClick={() => savePriceListItems.mutate()}
              disabled={isLoading}
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

