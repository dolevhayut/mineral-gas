import { useState } from "react";
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
import { SearchIcon, EyeIcon, Loader2Icon, FilterIcon, UserIcon, CalendarIcon, PackageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: {
    name: string;
  };
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  total: number;
  created_at: string;
  customer: {
    name: string;
  };
  order_items: OrderItem[];
}

const statusMap = {
  pending: { label: "ממתין", color: "default" },
  processing: { label: "בהכנה", color: "warning" },
  completed: { label: "הושלם", color: "success" },
  cancelled: { label: "בוטל", color: "destructive" },
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customer:custom_users(name),
          order_items(
            id,
            product_id,
            quantity,
            price,
            product:products(name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "שגיאה בטעינת הזמנות",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // If no orders found, return mock data
      if (!data || data.length === 0) {
        return [
          {
            id: "demo-123",
            customer_id: "demo-user-1",
            status: "pending",
            total: 120,
            created_at: new Date().toISOString(),
            customer: { name: "ישראל ישראלי" },
            order_items: [{ id: "item-1", product_id: "prod-1", quantity: 1, price: 120, product: { name: "עוגת שוקולד" } }]
          },
          {
            id: "demo-122",
            customer_id: "demo-user-2",
            status: "processing",
            total: 150,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            customer: { name: "יעקב יעקובי" },
            order_items: [{ id: "item-2", product_id: "prod-2", quantity: 1, price: 150, product: { name: "עוגת גבינה" } }]
          },
          {
            id: "demo-121",
            customer_id: "demo-user-3",
            status: "completed",
            total: 180,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            customer: { name: "רחל רחלי" },
            order_items: [{ id: "item-3", product_id: "prod-3", quantity: 1, price: 180, product: { name: "מארז קאפקייקס" } }]
          }
        ];
      }

      return data as Order[];
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "סטטוס עודכן",
        description: "סטטוס ההזמנה עודכן בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);
      
    const matchesStatus = filterStatus === "all" || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Get customer initials for avatar
  const getCustomerInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name[0];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <p className="text-muted-foreground">צפה ונהל את ההזמנות בחנות שלך</p>
      </div>

      {orders && orders[0]?.id.startsWith("demo-") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 font-medium">מוצגים נתוני דמו</p>
          <p className="text-yellow-600 text-sm">לא נמצאו הזמנות אמיתיות במסד הנתונים. הנתונים המוצגים הם לצורך הדגמה בלבד.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חפש לפי שם לקוח או מספר הזמנה..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {Object.entries(statusMap).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders?.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">הזמנה #{order.id.slice(0, 8)}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Badge variant={statusMap[order.status as keyof typeof statusMap].color as any}>
                        {statusMap[order.status as keyof typeof statusMap].label}
                      </Badge>
                    </CardDescription>
                  </div>
                  <p className="text-xl font-bold">₪{order.total}</p>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 bg-primary/10">
                      <AvatarFallback>{getCustomerInitials(order.customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <span className="font-medium">{order.customer.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground gap-1">
                    <PackageIcon className="h-4 w-4" />
                    <span>מוצרים: {order.order_items.length} פריטים</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2 gap-2">
                <Select
                  defaultValue={order.status}
                  onValueChange={(value) =>
                    updateOrderStatus.mutate({ id: order.id, status: value })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue>
                      עדכן סטטוס
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusMap).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        <Badge variant={statusMap[value as keyof typeof statusMap].color as any}>
                          {label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={() => viewOrderDetails(order)}>
                  <EyeIcon className="h-4 w-4 ml-2" />
                  פרטים
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {filteredOrders?.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl font-medium text-muted-foreground">לא נמצאו הזמנות</p>
          <p className="text-sm text-muted-foreground">נסה לשנות את החיפוש או הפילטרים</p>
        </div>
      )}
      
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>פרטי הזמנה #{selectedOrder.id.slice(0, 8)}</DialogTitle>
                <DialogDescription className="flex items-center">
                  <Badge variant={statusMap[selectedOrder.status as keyof typeof statusMap].color as any}>
                    {statusMap[selectedOrder.status as keyof typeof statusMap].label}
                  </Badge>
                  <span className="mr-2 text-muted-foreground">
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/10">
                    <AvatarFallback>{getCustomerInitials(selectedOrder.customer.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedOrder.customer.name}</h3>
                    <p className="text-sm text-muted-foreground">לקוח #{selectedOrder.customer_id.slice(0, 8)}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">פריטים בהזמנה</h3>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-muted-foreground">כמות: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">₪{item.price}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between">
                    <p className="font-medium">סה״כ לתשלום:</p>
                    <p className="font-bold text-lg">₪{selectedOrder.total}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <p className="font-medium">עדכן סטטוס:</p>
                  <Select
                    defaultValue={selectedOrder.status}
                    onValueChange={(value) => {
                      updateOrderStatus.mutate({ id: selectedOrder.id, status: value });
                      setSelectedOrder({...selectedOrder, status: value});
                    }}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          <Badge variant={statusMap[value as keyof typeof statusMap].color as any}>
                            {label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => setIsDetailsOpen(false)}
                >
                  סגור
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 