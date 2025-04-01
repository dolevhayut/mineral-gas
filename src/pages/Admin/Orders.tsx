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
  day_of_week: string;
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
  processing: { label: "בהכנה", color: "secondary" },
  completed: { label: "הושלם", color: "outline" },
  cancelled: { label: "בוטל", color: "destructive" },
};

// Map of English day names to Hebrew day names for display
const dayNameMap: Record<string, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת",
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
          customer:customers(
            id,
            name,
            user_id
          ),
          order_items(
            id,
            product_id,
            quantity,
            price,
            day_of_week,
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
        return [];
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

  // Process order items to group by day
  const groupOrderItemsByDay = (orderItems: OrderItem[]) => {
    const groupedByDay: Record<string, {
      day: string;
      dayHebrew: string;
      items: {
        id: string;
        productName: string;
        quantity: number;
        price: number;
      }[];
      totalQuantity: number;
    }> = {};

    orderItems.forEach(item => {
      const day = item.day_of_week;
      if (!groupedByDay[day]) {
        groupedByDay[day] = {
          day,
          dayHebrew: dayNameMap[day] || day,
          items: [],
          totalQuantity: 0
        };
      }

      groupedByDay[day].items.push({
        id: item.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price
      });

      groupedByDay[day].totalQuantity += item.quantity;
    });

    // Sort days according to week order
    const dayOrder: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6
    };

    return Object.values(groupedByDay).sort((a, b) => {
      return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
        <p className="text-muted-foreground">צפה ונהל את ההזמנות בחנות שלך</p>
      </div>

      {(!orders || orders.length === 0) && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-xl font-bold text-red-700 mb-2">אין נתונים זמינים</p>
          <p className="text-red-600">התרחשה תקלה בטעינת הנתונים ממסד הנתונים</p>
          <p className="text-red-600">נא לפנות לתמיכה הטכנית</p>
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
            <SelectTrigger className="w-full sm:w-[180px] text-right flex flex-row-reverse justify-between">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent align="end" className="text-right">
              <SelectItem value="all" className="flex justify-end">כל הסטטוסים</SelectItem>
              {Object.entries(statusMap).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="flex justify-end">{label}</SelectItem>
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
                      <Badge variant={statusMap[order.status as keyof typeof statusMap].color as "default" | "secondary" | "outline" | "destructive"}>
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
                <div className="w-1/2">
                  <Select
                    defaultValue={order.status}
                    onValueChange={(value) =>
                      updateOrderStatus.mutate({ id: order.id, status: value })
                    }
                  >
                    <SelectTrigger className="w-full text-right flex flex-row-reverse justify-between">
                      <SelectValue>
                        עדכן סטטוס
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      {Object.entries(statusMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value} className="flex justify-end">
                          <Badge variant={statusMap[value as keyof typeof statusMap].color as "default" | "secondary" | "outline" | "destructive"}>
                            {label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => viewOrderDetails(order)} className="w-1/2">
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
                  <Badge variant={statusMap[selectedOrder.status as keyof typeof statusMap].color as "default" | "secondary" | "outline" | "destructive"}>
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
                
                {/* Order Summary Layout similar to OrderSummaryPage */}
                <Card className="p-4 shadow-sm">
                  <div className="space-y-4">
                    <h3 className="font-medium text-xl mb-4 text-right">פריטים לפי ימים:</h3>
                    
                    {groupOrderItemsByDay(selectedOrder.order_items).map((daySummary) => (
                      <div key={daySummary.day} className="flex flex-col border-b pb-4 pt-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-500">סה"כ: {daySummary.totalQuantity} יח׳</span>
                          <h4 className="font-medium text-lg">יום {daySummary.dayHebrew}</h4>
                        </div>
                        
                        {daySummary.items.map((item) => (
                          <div key={item.id} className="flex justify-between my-1 pr-4">
                            <span className="text-sm">{item.quantity} יח׳ × ₪{item.price}</span>
                            <span className="text-sm text-gray-700">{item.productName}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex justify-between">
                        <p className="font-medium">סה״כ לתשלום:</p>
                        <p className="font-bold text-lg">₪{selectedOrder.total}</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <div className="flex justify-between items-center">
                  <p className="font-medium">עדכן סטטוס:</p>
                  <Select
                    defaultValue={selectedOrder.status}
                    onValueChange={(value) => {
                      updateOrderStatus.mutate({ id: selectedOrder.id, status: value });
                      setSelectedOrder({...selectedOrder, status: value});
                    }}
                  >
                    <SelectTrigger className="w-[180px] text-right flex flex-row-reverse justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      {Object.entries(statusMap).map(([value, { label }]) => (
                        <SelectItem key={value} value={value} className="flex justify-end">
                          <Badge variant={statusMap[value as keyof typeof statusMap].color as "default" | "secondary" | "outline" | "destructive"}>
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
                  className="flex-1 mt-4" 
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