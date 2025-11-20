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
import { SearchIcon, EyeIcon, Loader2Icon, FilterIcon, UserIcon, CalendarIcon, PackageIcon, Phone, MapPin, Trash2, Edit3, PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getHebrewDayName } from "@/lib/deliveryDays";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
  };
}

interface Order {
  id: string;
  order_number: number;
  customer_id: string;
  status: string;
  payment_status: string;
  delivery_status: string;
  total: number;
  created_at: string;
  delivery_address?: string;
  delivery_date?: string;
  target_date?: string;
  special_instructions?: string;
  customers: {
    name: string;
    phone: string;
    last_safety_inspection_date?: string | null;
  };
  order_items: OrderItem[];
}

const paymentStatusMap: Record<string, { label: string; color: "default" | "secondary" | "outline" | "destructive"; bgColor: string; textColor: string }> = {
  pending: { label: "ממתין לתשלום", color: "destructive", bgColor: "bg-red-100", textColor: "text-red-700" },
  paid: { label: "שולם", color: "outline", bgColor: "bg-green-100", textColor: "text-green-700" },
};

const deliveryStatusMap: Record<string, { label: string; color: "default" | "secondary" | "outline" | "destructive"; bgColor: string; textColor: string }> = {
  pending: { label: "טרם סופק", color: "secondary", bgColor: "bg-yellow-100", textColor: "text-yellow-700" },
  delivered: { label: "סופק ללקוח", color: "outline", bgColor: "bg-green-100", textColor: "text-green-700" },
  cancelled: { label: "בוטל", color: "destructive", bgColor: "bg-red-100", textColor: "text-red-700" },
};

// חישוב מע"מ - ברירת מחדל 17%
const VAT_PERCENTAGE = 17;

const calculateVAT = (total: number, vatPercentage: number = VAT_PERCENTAGE) => {
  // המחיר כולל מע"מ, לכן נחלץ את סכום המע"מ
  const vatAmount = total - (total / (1 + vatPercentage / 100));
  const priceBeforeVAT = total - vatAmount;
  
  return {
    priceBeforeVAT: priceBeforeVAT.toFixed(2),
    vatAmount: vatAmount.toFixed(2),
    total: total.toFixed(2)
  };
};


export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>("all");
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch customers for new order
  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, city")
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          customers!inner(
            id,
            name,
            phone,
            last_safety_inspection_date
          ),
          order_items(
            id,
            product_id,
            quantity,
            price,
            products(name)
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

      return data as any as Order[];
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, payment_status, delivery_status }: { id: string; payment_status?: string; delivery_status?: string }) => {
      const updateData: any = {};
      if (payment_status !== undefined) updateData.payment_status = payment_status;
      if (delivery_status !== undefined) updateData.delivery_status = delivery_status;
      
      const { error } = await supabase
        .from("orders")
        .update(updateData)
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
      order.customers.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.includes(searchQuery);
      
    const matchesPaymentStatus = filterPaymentStatus === "all" || order.payment_status === filterPaymentStatus;
    const matchesDeliveryStatus = filterDeliveryStatus === "all" || order.delivery_status === filterDeliveryStatus;
    
    return matchesSearch && matchesPaymentStatus && matchesDeliveryStatus;
  });

  const formatDate = (dateString: string, includeTime: boolean = true) => {
    // Check if dateString is in YYYY-MM-DD format (date only, no time)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    // For datetime strings, include time only if requested
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    return new Date(dateString).toLocaleDateString("he-IL", options);
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    // TODO: Implement edit order functionality
    toast({
      title: "עריכת הזמנה",
      description: "פונקציונליות זו תהיה זמינה בקרוב",
    });
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("האם אתה בטוח שברצונך למחוק הזמנה זו?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "הזמנה נמחקה",
        description: "ההזמנה נמחקה בהצלחה",
      });

      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "אירעה שגיאה במחיקת ההזמנה";
      toast({
        title: "שגיאה במחיקת הזמנה",
        description: errorMessage,
        variant: "destructive",
      });
    }
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

  const handleCreateOrderForCustomer = () => {
    if (!selectedCustomer) {
      toast({
        title: "בחר לקוח",
        description: "יש לבחור לקוח לפני יצירת הזמנה",
        variant: "destructive",
      });
      return;
    }

    // Navigate to admin new order page with customer context
    navigate("/admin/orders/new", {
      state: {
        adminSelectedCustomerId: selectedCustomer
      }
    });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול הזמנות</h1>
          <p className="text-muted-foreground">צפה ונהל את ההזמנות בחנות שלך</p>
        </div>
        <Button
          onClick={() => setIsCreateOrderOpen(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <PlusIcon className="ml-2 h-4 w-4" />
          הזמנה חדשה
        </Button>
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
            value={filterPaymentStatus}
            onValueChange={setFilterPaymentStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-right flex flex-row-reverse justify-between">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סטטוס תשלום" />
            </SelectTrigger>
            <SelectContent align="end" className="text-right">
              <SelectItem value="all" className="text-right">כל סטטוסי התשלום</SelectItem>
              {Object.entries(paymentStatusMap).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="text-right">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={filterDeliveryStatus}
            onValueChange={setFilterDeliveryStatus}
          >
            <SelectTrigger className="w-full sm:w-[180px] text-right flex flex-row-reverse justify-between">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סטטוס אספקה" />
            </SelectTrigger>
            <SelectContent align="end" className="text-right">
              <SelectItem value="all" className="text-right">כל סטטוסי האספקה</SelectItem>
              {Object.entries(deliveryStatusMap).map(([key, { label }]) => (
                <SelectItem key={key} value={key} className="text-right">{label}</SelectItem>
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
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <TooltipProvider>
              <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-right">מספר הזמנה</TableHead>
                      <TableHead className="text-right">לקוח</TableHead>
                      <TableHead className="text-right">טלפון</TableHead>
                      <TableHead className="text-right min-w-[200px]">כתובת</TableHead>
                      <TableHead className="text-center">סטטוס תשלום</TableHead>
                      <TableHead className="text-center">סטטוס אספקה</TableHead>
                      <TableHead className="text-right">תאריך הזמנה</TableHead>
                      <TableHead className="text-right">תאריך אספקה</TableHead>
                      <TableHead className="text-right">יום אספקה</TableHead>
                      <TableHead className="text-right">בדיקת תקנות</TableHead>
                      <TableHead className="text-right">הערות</TableHead>
                      <TableHead className="text-center w-16">פריטים</TableHead>
                      <TableHead className="text-right">סה"כ</TableHead>
                      <TableHead className="text-center w-32">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                        {/* מספר הזמנה */}
                        <TableCell className="font-medium">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">...{order.id.slice(-8)}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{order.id}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        
                        {/* לקוח */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs bg-primary/10">
                                {getCustomerInitials(order.customers.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{order.customers.name}</span>
                          </div>
                        </TableCell>
                        
                        {/* טלפון */}
                        <TableCell dir="ltr" className="text-right">{order.customers.phone}</TableCell>
                        
                        {/* כתובת */}
                        <TableCell className="max-w-[200px]">
                          <div className="truncate">
                            {order.delivery_address ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">{order.delivery_address}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs">{order.delivery_address}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* סטטוס תשלום */}
                        <TableCell>
                          <Badge 
                            className={`w-full justify-center ${paymentStatusMap[order.payment_status]?.bgColor || "bg-gray-100"} ${paymentStatusMap[order.payment_status]?.textColor || "text-gray-700"} border-0`}
                          >
                            {paymentStatusMap[order.payment_status]?.label || order.payment_status}
                          </Badge>
                        </TableCell>
                        
                        {/* סטטוס אספקה */}
                        <TableCell>
                          <Badge 
                            className={`w-full justify-center ${deliveryStatusMap[order.delivery_status]?.bgColor || "bg-gray-100"} ${deliveryStatusMap[order.delivery_status]?.textColor || "text-gray-700"} border-0`}
                          >
                            {deliveryStatusMap[order.delivery_status]?.label || order.delivery_status}
                          </Badge>
                        </TableCell>
                        
                        {/* תאריך הזמנה */}
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {new Date(order.created_at).toLocaleString("he-IL", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{formatDate(order.created_at)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        
                        {/* תאריך אספקה */}
                        <TableCell>
                          {order.delivery_date || order.target_date ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help font-medium">
                                  {(() => {
                                    // Parse date string as local date to avoid timezone issues
                                    const dateStr = order.delivery_date || order.target_date!;
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    const date = new Date(year, month - 1, day);
                                    return date.toLocaleDateString("he-IL");
                                  })()}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatDate(order.delivery_date || order.target_date!, false)}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        
                        {/* יום אספקה */}
                        <TableCell>
                          {order.delivery_date || order.target_date ? (
                            <span className="font-medium text-blue-600">
                              {(() => {
                                // Parse date string as local date to avoid timezone issues
                                const dateStr = order.delivery_date || order.target_date!;
                                const [year, month, day] = dateStr.split('-').map(Number);
                                const date = new Date(year, month - 1, day);
                                return getHebrewDayName(date.getDay());
                              })()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        
                        {/* בדיקת תקנות */}
                        <TableCell>
                          {order.customers.last_safety_inspection_date ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help font-medium">
                                  {(() => {
                                    // Parse date string as local date to avoid timezone issues
                                    const dateStr = order.customers.last_safety_inspection_date;
                                    const [year, month, day] = dateStr.split('-').map(Number);
                                    const date = new Date(year, month - 1, day);
                                    return date.toLocaleDateString("he-IL");
                                  })()}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatDate(order.customers.last_safety_inspection_date, false)}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        
                        {/* הערות */}
                        <TableCell className="max-w-[150px]">
                          {order.special_instructions ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help truncate block">
                                  {order.special_instructions}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="whitespace-pre-wrap">{order.special_instructions}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        
                        {/* פריטים */}
                        <TableCell className="text-center">{order.order_items.length}</TableCell>
                        
                        {/* סה"כ */}
                        <TableCell className="font-medium">₪{order.total}</TableCell>
                        
                        {/* פעולות */}
                        <TableCell className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => viewOrderDetails(order)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>צפייה בהזמנה</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>עריכת הזמנה</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteOrder(order.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>מחיקת הזמנה</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredOrders?.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-xl font-medium text-muted-foreground">לא נמצאו הזמנות</p>
                    <p className="text-sm text-muted-foreground">נסה לשנות את החיפוש או הפילטרים</p>
                  </div>
                )}
              </div>
            </TooltipProvider>
          </div>

          {/* Mobile Card View */}
          <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
              {filteredOrders?.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{order.customers.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1 gap-2 flex-wrap">
                        <Badge 
                          className={`${paymentStatusMap[order.payment_status]?.bgColor || "bg-gray-100"} ${paymentStatusMap[order.payment_status]?.textColor || "text-gray-700"} border-0`}
                        >
                          {paymentStatusMap[order.payment_status]?.label || order.payment_status}
                        </Badge>
                        <Badge 
                          className={`${deliveryStatusMap[order.delivery_status]?.bgColor || "bg-gray-100"} ${deliveryStatusMap[order.delivery_status]?.textColor || "text-gray-700"} border-0`}
                        >
                          {deliveryStatusMap[order.delivery_status]?.label || order.delivery_status}
                        </Badge>
                        <span className="text-xs">₪{order.total}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span dir="ltr">{order.customers.phone}</span>
                    </div>
                    
                    {order.delivery_address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span className="flex-1">{order.delivery_address}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                    
                    {(order.delivery_date || order.target_date) && (
                      <div className="flex items-center text-sm gap-1">
                        <CalendarIcon className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-600">
                          {(() => {
                            // Parse date string as local date to avoid timezone issues
                            const dateStr = order.delivery_date || order.target_date!;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return getHebrewDayName(date.getDay());
                          })()}
                        </span>
                        <span className="text-muted-foreground">
                          ({(() => {
                            const dateStr = order.delivery_date || order.target_date!;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString("he-IL");
                          })()})
                        </span>
                      </div>
                    )}
                    
                    {order.customers.last_safety_inspection_date && (
                      <div className="flex items-center text-sm gap-1 text-orange-600">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="font-medium">בדיקת תקנות:</span>
                        <span>
                          {(() => {
                            const dateStr = order.customers.last_safety_inspection_date;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return date.toLocaleDateString("he-IL");
                          })()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-muted-foreground gap-1">
                      <PackageIcon className="h-4 w-4" />
                      <span>מוצרים: {order.order_items.length} פריטים</span>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-center pt-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>צפייה בהזמנה</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditOrder(order)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>עריכת הזמנה</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>מחיקת הזמנה</p>
                    </TooltipContent>
                  </Tooltip>
                </CardFooter>
              </Card>
              ))}
            </div>
          </TooltipProvider>
        </>
      )}

      
      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-2xl">הזמנה #{selectedOrder.order_number}</DialogTitle>
                    <DialogDescription className="text-base">
                      {selectedOrder.customers.name} • {selectedOrder.customers.phone}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      className={`${paymentStatusMap[selectedOrder.payment_status]?.bgColor || "bg-gray-100"} ${paymentStatusMap[selectedOrder.payment_status]?.textColor || "text-gray-700"} border-0`}
                    >
                      {paymentStatusMap[selectedOrder.payment_status]?.label || selectedOrder.payment_status}
                    </Badge>
                    <Badge 
                      className={`${deliveryStatusMap[selectedOrder.delivery_status]?.bgColor || "bg-gray-100"} ${deliveryStatusMap[selectedOrder.delivery_status]?.textColor || "text-gray-700"} border-0`}
                    >
                      {deliveryStatusMap[selectedOrder.delivery_status]?.label || selectedOrder.delivery_status}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="space-y-4">
                <Separator />
                
                {/* Order Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-muted-foreground">תאריך הזמנה:</span>
                    <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                  </div>
                  
                  {(selectedOrder.delivery_date || selectedOrder.target_date) && (
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">תאריך אספקה:</span>
                      <div className="text-left">
                        <p className="font-medium">
                          {(() => {
                            const dateStr = selectedOrder.delivery_date || selectedOrder.target_date!;
                            const [year, month, day] = dateStr.split('-').map(Number);
                            const date = new Date(year, month - 1, day);
                            return getHebrewDayName(date.getDay());
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(selectedOrder.delivery_date || selectedOrder.target_date!, false)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start justify-between py-2 border-b">
                      <span className="text-muted-foreground">כתובת משלוח:</span>
                      <span className="font-medium text-left">{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                  
                  {selectedOrder.special_instructions && (
                    <div className="flex items-start justify-between py-2 border-b">
                      <span className="text-muted-foreground">הערות:</span>
                      <span className="font-medium text-left max-w-[60%] whitespace-pre-wrap">
                        {selectedOrder.special_instructions}
                      </span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Order Summary Layout similar to OrderSummaryPage */}
                <Card className="p-4 shadow-sm">
                  <div className="space-y-4">
                    <h3 className="font-medium text-xl mb-4 text-right">פריטי ההזמנה:</h3>
                    
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                        <div className="flex-1">
                          <span className="font-medium">{item.products.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{item.quantity} יח׳</span>
                          <span className="text-sm">₪{item.price}</span>
                          <span className="font-medium">₪{(item.quantity * item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                    
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      <div className="flex justify-between text-sm">
                        <p>סכום לפני מע״מ:</p>
                        <p>₪{calculateVAT(selectedOrder.total).priceBeforeVAT}</p>
                      </div>
                      <div className="flex justify-between text-sm">
                        <p>מע״מ ({VAT_PERCENTAGE}%):</p>
                        <p>₪{calculateVAT(selectedOrder.total).vatAmount}</p>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between">
                        <p className="font-medium">סה״כ לתשלום:</p>
                        <p className="font-bold text-lg">₪{selectedOrder.total}</p>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Payment Status Section */}
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <p className="font-medium mb-3 flex items-center gap-2">
                    <span className="text-blue-700">💳</span>
                    עדכון סטטוס תשלום:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(paymentStatusMap).map(([value, { label, bgColor, textColor }]) => (
                      <Button
                        key={value}
                        variant={selectedOrder.payment_status === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateOrderStatus.mutate({ id: selectedOrder.id, payment_status: value });
                          setSelectedOrder({...selectedOrder, payment_status: value});
                        }}
                        className={`transition-all ${selectedOrder.payment_status === value ? `${bgColor} ${textColor} hover:opacity-90` : ""}`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Delivery Status Section */}
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <p className="font-medium mb-3 flex items-center gap-2">
                    <span className="text-green-700">🚚</span>
                    עדכון סטטוס אספקה:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(deliveryStatusMap).map(([value, { label, bgColor, textColor }]) => (
                      <Button
                        key={value}
                        variant={selectedOrder.delivery_status === value ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          updateOrderStatus.mutate({ id: selectedOrder.id, delivery_status: value });
                          setSelectedOrder({...selectedOrder, delivery_status: value});
                        }}
                        className={`transition-all ${selectedOrder.delivery_status === value ? `${bgColor} ${textColor} hover:opacity-90` : ""}`}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
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

      {/* Create Order Dialog - Select Customer */}
      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>יצירת הזמנה חדשה</DialogTitle>
            <DialogDescription>
              בחר לקוח ממערכת כדי ליצור עבורו הזמנה
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="customer-select" className="text-sm font-medium text-right">
                בחר לקוח
              </label>
              {customers && customers.length > 0 ? (
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger id="customer-select">
                    <SelectValue placeholder="בחר לקוח מהרשימה" />
                  </SelectTrigger>
                  <SelectContent align="end" className="text-right">
                    <div className="p-2">
                      <Input
                        placeholder="חפש לקוח..."
                        className="h-8 mb-2 text-right"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const search = e.target.value.toLowerCase();
                          const items = document.querySelectorAll('[role="option"]');
                          items.forEach((item) => {
                            const text = item.textContent?.toLowerCase() || '';
                            (item as HTMLElement).style.display = text.includes(search) ? '' : 'none';
                          });
                        }}
                      />
                    </div>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="text-right">
                        <>
                          <span className="font-medium block">{customer.name}</span>
                          <span className="text-xs text-gray-500 block">
                            {customer.phone} {customer.city && `• ${customer.city}`}
                          </span>
                        </>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-center text-sm text-gray-500 py-4">
                  טוען לקוחות...
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOrderOpen(false);
                setSelectedCustomer("");
              }}
            >
              ביטול
            </Button>
            <Button
              onClick={handleCreateOrderForCustomer}
              disabled={!selectedCustomer}
              className="bg-green-600 hover:bg-green-700"
            >
              המשך ליצירת הזמנה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 