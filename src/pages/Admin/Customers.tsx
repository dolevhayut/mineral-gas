import { useState, useEffect } from "react";
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
  SearchIcon, 
  PhoneIcon, 
  BuildingIcon, 
  PencilIcon, 
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  PackageIcon,
  AlertCircle
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
import { Switch } from "@/components/ui/switch";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  special_requirements?: string;
  active_orders_count?: number;
  total_orders_count?: number;
  discount_percentage?: number;
  city?: string;
  business_type?: string;
  customer_type?: string;
  price_list_id?: string | null;
  last_safety_inspection_date?: string | null;
  created_at?: string;
  updated_at?: string;
  open_balance?: number;
}

interface PriceList {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
}

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch cities from government API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=2000');
        const data = await response.json();
        if (data.success) {
          const records: { "שם_ישוב": string; "שם_נפה": string }[] = data.result.records;
          const northernDistricts = ["עכו", "יזרעאל", "צפת", "כנרת", "גולן", "חיפה"];

          const northernCities = records
            .filter(record => 
              record['שם_נפה'] && 
              northernDistricts.includes(record['שם_נפה'].trim()) &&
              record['שם_ישוב'] &&
              record['שם_ישוב'].trim() !== ''
            )
            .map(record => record['שם_ישוב'].trim());

          const cityNames: string[] = [...new Set(northernCities)].sort();
          setCities(cityNames);
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    fetchCities();
  }, []);

  // Fetch price lists
  const { data: priceLists } = useQuery({
    queryKey: ["price_lists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_lists")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching price lists:", error);
        return [];
      }

      return data as PriceList[];
    },
  });

  // Fetch customers
  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      // Get customers with aggregated order data in a single query
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select(`
          *,
          orders(
            id,
            status,
            total
          )
        `)
        .order("name", { ascending: true });

      if (customerError) {
        toast({
          title: "שגיאה בטעינת לקוחות",
          description: customerError.message,
          variant: "destructive",
        });
        throw customerError;
      }

      // If no customers found, return empty array
      if (!customerData || customerData.length === 0) {
        return [];
      }

      // Process the data to calculate aggregated values
      const customersWithDetails = customerData.map((customer) => {
        const orders = customer.orders || [];
        
        // Calculate active orders count (status = 'pending')
        const activeOrdersCount = orders.filter(order => order.status === 'pending').length;
        
        // Calculate total orders count
        const totalOrdersCount = orders.length;
        
        // Calculate open balance (orders that are not completed or cancelled)
        const openBalance = orders
          .filter(order => ['pending', 'delivered'].includes(order.status))
          .reduce((sum, order) => sum + (Number(order.total) || 0), 0);
        
        // Remove the orders array from the customer object
        const { orders: _, ...customerWithoutOrders } = customer;
        
        return {
          ...customerWithoutOrders,
          active_orders_count: activeOrdersCount,
          total_orders_count: totalOrdersCount,
          open_balance: openBalance,
        };
      });
      
      return customersWithDetails;
    },
  });


  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["customers"] })
      .then(() => {
        toast({
          title: "רשימת הלקוחות עודכנה",
          duration: 2000,
        });
        setIsRefreshing(false);
      });
  };

  // Save customer mutation
  const saveCustomer = useMutation({
    mutationFn: async (customer: Partial<Customer>) => {
      const isNewCustomer = !customer.id;
      
      // Check if required fields are provided
      if (!customer.name) {
        throw new Error("חובה להזין שם לקוח");
      }
      
      if (!customer.phone) {
        throw new Error("חובה להזין מספר טלפון");
      }
      
      setIsLoading(true);
      
      // Parse discount_percentage to ensure it's a number
      const discount = customer.discount_percentage !== undefined 
        ? Number(customer.discount_percentage) 
        : 0;
      
      if (isNewCustomer) {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([{ 
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            special_requirements: customer.special_requirements,
            business_type: customer.business_type || 'residential',
            customer_type: customer.customer_type || 'active',
            discount_percentage: discount
          }]);
          
        if (error) throw error;
      } else {
        // Update existing customer
        const { error } = await supabase
          .from("customers")
          .update({ 
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            city: customer.city,
            special_requirements: customer.special_requirements,
            business_type: customer.business_type,
            customer_type: customer.customer_type,
            discount_percentage: discount
          })
          .eq("id", customer.id);
          
        if (error) throw error;
      }
      
      setIsLoading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "לקוח נשמר",
        description: "פרטי הלקוח נשמרו בהצלחה",
        duration: 2000,
      });
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "שגיאה בשמירת לקוח",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Delete customer mutation
  const deleteCustomer = useMutation({
    mutationFn: async (customerId: string) => {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);
        
      if (error) throw error;
      
      setIsLoading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast({
        title: "לקוח נמחק",
        description: "הלקוח נמחק בהצלחה",
        duration: 2000,
      });
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "שגיאה במחיקת לקוח",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const filteredCustomers = customers?.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchQuery)) ||
    (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.city && customer.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (customer.special_requirements && customer.special_requirements.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleAddCustomer = () => {
    setCurrentCustomer({});
    setIsAddDialogOpen(true);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      deleteCustomer.mutate(customerToDelete.id);
    }
  };

  // Check if safety inspection is overdue (4.5 years)
  const checkSafetyInspectionStatus = (date?: string | null) => {
    if (!date) return null;
    
    const inspectionDate = new Date(date);
    const now = new Date();
    const yearsDiff = (now.getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (yearsDiff >= 4.5) {
      return {
        isOverdue: true,
        message: `⚠️ דחוף! עברו ${yearsDiff.toFixed(1)} שנים מהבדיקה האחרונה`,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-300"
      };
    } else if (yearsDiff >= 4) {
      return {
        isOverdue: false,
        message: `⚡ התקרב מועד הבדיקה - עברו ${yearsDiff.toFixed(1)} שנים`,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-300"
      };
    }
    
    return null;
  };

  const renderCustomerDialog = (isAdd: boolean) => {
    const dialogTitle = isAdd ? "הוספת לקוח חדש" : "עריכת פרטי לקוח";
    const dialogDescription = isAdd 
      ? "הזן את פרטי הלקוח החדש ולחץ שמור כדי להוסיף"
      : "ערוך את פרטי הלקוח ולחץ שמור כדי לעדכן";
    const isOpen = isAdd ? isAddDialogOpen : isEditDialogOpen;
    const setIsOpen = isAdd ? setIsAddDialogOpen : setIsEditDialogOpen;
    
    const safetyStatus = checkSafetyInspectionStatus(currentCustomer.last_safety_inspection_date);
    
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {dialogDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם הלקוח <span className="text-red-500 mr-1">*</span></Label>
              <Input
                id="name"
                placeholder="הכנס שם לקוח"
                value={currentCustomer.name || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">טלפון <span className="text-red-500 mr-1">*</span></Label>
              <Input
                id="phone"
                placeholder="הכנס מספר טלפון"
                value={currentCustomer.phone || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                placeholder="הכנס כתובת"
                value={currentCustomer.address || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, address: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">יישוב</Label>
              {cities.length > 0 ? (
                <Select 
                  value={currentCustomer.city || ""} 
                  onValueChange={(value) => setCurrentCustomer({ ...currentCustomer, city: value })}
                >
                  <SelectTrigger className="text-right">
                    <SelectValue placeholder="בחר יישוב" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="חפש יישוב..."
                        className="h-8 mb-2"
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
                    {cities.map(city => (
                      <SelectItem key={city} value={city} className="text-right">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input disabled placeholder="טוען יישובים..." />
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="business_type">סוג לקוח</Label>
              <Select
                value={currentCustomer.business_type || "residential"}
                onValueChange={(value) => setCurrentCustomer({ ...currentCustomer, business_type: value })}
              >
                <SelectTrigger id="business_type" className="text-right">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential" className="text-right">פרטי</SelectItem>
                  <SelectItem value="commercial" className="text-right">עסקי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_type">סטטוס לקוח</Label>
              <Select
                value={currentCustomer.customer_type || "active"}
                onValueChange={(value) => setCurrentCustomer({ ...currentCustomer, customer_type: value })}
              >
                <SelectTrigger id="customer_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">פעיל</SelectItem>
                  <SelectItem value="suspended">מושעה</SelectItem>
                  <SelectItem value="inactive">לא פעיל</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="discount_percentage">אחוז הנחה</Label>
              <Input
                id="discount_percentage"
                type="number"
                min="0"
                max="100"
                placeholder="הכנס אחוז הנחה"
                value={currentCustomer.discount_percentage !== undefined ? currentCustomer.discount_percentage : ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                  setCurrentCustomer({ ...currentCustomer, discount_percentage: value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price_list">מחירון</Label>
              <Select
                value={currentCustomer.price_list_id || "none"}
                onValueChange={(value) => setCurrentCustomer({ ...currentCustomer, price_list_id: value === "none" ? null : value })}
              >
                <SelectTrigger id="price_list">
                  <SelectValue placeholder="בחר מחירון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא מחירון (ברירת מחדל)</SelectItem>
                  {priceLists?.map((priceList) => (
                    <SelectItem key={priceList.id} value={priceList.id}>
                      {priceList.name}
                      {priceList.description && ` - ${priceList.description}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_safety_inspection_date">תאריך בדיקה תקנית אחרונה</Label>
              <Input
                id="last_safety_inspection_date"
                type="date"
                value={currentCustomer.last_safety_inspection_date || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, last_safety_inspection_date: e.target.value })}
              />
              {safetyStatus && (
                <div className={`flex items-center gap-2 p-3 rounded-md border ${safetyStatus.bgColor} ${safetyStatus.borderColor}`}>
                  <AlertCircle className={`h-5 w-5 ${safetyStatus.color}`} />
                  <span className={`text-sm font-medium ${safetyStatus.color}`}>
                    {safetyStatus.message}
                  </span>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="special_requirements">דרישות מיוחדות</Label>
              <Input
                id="special_requirements"
                placeholder="הכנס דרישות מיוחדות"
                value={currentCustomer.special_requirements || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, special_requirements: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => saveCustomer.mutate(currentCustomer)}
              disabled={isLoading || !currentCustomer.name || !currentCustomer.phone}
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול לקוחות</h1>
          <p className="text-muted-foreground">צפה ונהל את העסקים והלקוחות במערכת</p>
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
          <Button onClick={handleAddCustomer} className="flex-1 sm:flex-auto">
            <PlusIcon className="h-4 w-4 ml-2" />
            לקוח חדש
          </Button>
        </div>
      </div>

      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="חפש לפי שם, טלפון, עיר או הערות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-3 pr-10"
        />
      </div>

      {isCustomersLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Desktop view - table */}
          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <div className="overflow-auto max-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">שם הלקוח</TableHead>
                      <TableHead className="whitespace-nowrap">טלפון</TableHead>
                      <TableHead className="whitespace-nowrap">עיר</TableHead>
                      <TableHead className="whitespace-nowrap">סוג לקוח</TableHead>
                      <TableHead className="whitespace-nowrap">סטטוס</TableHead>
                      <TableHead className="whitespace-nowrap">בדיקה תקנית</TableHead>
                      <TableHead className="whitespace-nowrap">חוב פתוח</TableHead>
                      <TableHead className="whitespace-nowrap">הנחה</TableHead>
                      <TableHead className="whitespace-nowrap">הזמנות פעילות</TableHead>
                      <TableHead className="whitespace-nowrap">דרישות מיוחדות</TableHead>
                      <TableHead className="whitespace-nowrap">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers?.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.phone ? (
                            <div className="flex items-center gap-2">
                              <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.city || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={customer.business_type === "residential" ? "secondary" : "default"}>
                            {customer.business_type === "residential" ? "פרטי" : "עסקי"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge 
                            variant={customer.customer_type === "active" ? "default" : 
                                   customer.customer_type === "suspended" ? "destructive" : "secondary"}
                          >
                            {customer.customer_type === "active" ? "פעיל" :
                             customer.customer_type === "suspended" ? "מושעה" : "לא פעיל"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {(() => {
                            const safetyStatus = checkSafetyInspectionStatus(customer.last_safety_inspection_date);
                            if (!customer.last_safety_inspection_date) {
                              return <span className="text-muted-foreground">לא נרשם</span>;
                            }
                            if (safetyStatus?.isOverdue) {
                              return (
                                <Badge variant="destructive" className="bg-red-600">
                                  <AlertCircle className="h-3 w-3 ml-1" />
                                  דחוף!
                                </Badge>
                              );
                            }
                            if (safetyStatus) {
                              return (
                                <Badge variant="outline" className="border-orange-400 text-orange-600">
                                  <AlertCircle className="h-3 w-3 ml-1" />
                                  התקרב
                                </Badge>
                              );
                            }
                            return (
                              <Badge variant="outline" className="border-green-400 text-green-600">
                                תקין
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.open_balance ? (
                            <span className="text-red-600 font-medium">
                              ₪{customer.open_balance.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-green-600">₪0.00</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.discount_percentage ? 
                            <span className="text-green-600 font-medium">{customer.discount_percentage}%</span> : 
                            <span className="text-muted-foreground">0%</span>
                          }
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {customer.active_orders_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span className="text-sm text-muted-foreground truncate block" title={customer.special_requirements || ""}>
                            {customer.special_requirements || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer)}>
                              <PencilIcon className="h-4 w-4 ml-2" />
                              עריכה
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteCustomer(customer)}
                            >
                              <TrashIcon className="h-4 w-4 ml-2" />
                              מחיקה
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredCustomers?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          לא נמצאו לקוחות
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile view - cards */}
          <div className="md:hidden space-y-4">
            {filteredCustomers?.map((customer) => (
              <Card key={customer.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center">
                      <BuildingIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                      {customer.name}
                    </CardTitle>
                    <Badge 
                      variant={customer.customer_type === "active" ? "default" : 
                             customer.customer_type === "suspended" ? "destructive" : "secondary"}
                    >
                      {customer.customer_type === "active" ? "פעיל" :
                       customer.customer_type === "suspended" ? "מושעה" : "לא פעיל"}
                    </Badge>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <PhoneIcon className="h-3 w-3 ml-1" />
                      {customer.phone}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground">סוג לקוח</div>
                      <div className="text-sm font-medium mt-1">
                        {customer.business_type === "residential" ? "פרטי" : "עסקי"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">בדיקה תקנית</div>
                      <div className="text-sm font-medium mt-1">
                        {(() => {
                          const safetyStatus = checkSafetyInspectionStatus(customer.last_safety_inspection_date);
                          if (!customer.last_safety_inspection_date) {
                            return <span className="text-muted-foreground">לא נרשם</span>;
                          }
                          if (safetyStatus?.isOverdue) {
                            return (
                              <Badge variant="destructive" className="bg-red-600">
                                <AlertCircle className="h-3 w-3 ml-1" />
                                דחוף!
                              </Badge>
                            );
                          }
                          if (safetyStatus) {
                            return (
                              <Badge variant="outline" className="border-orange-400 text-orange-600">
                                <AlertCircle className="h-3 w-3 ml-1" />
                                התקרב
                              </Badge>
                            );
                          }
                          return (
                            <Badge variant="outline" className="border-green-400 text-green-600">
                              תקין
                            </Badge>
                          );
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">חוב פתוח</div>
                      <div className="text-sm font-medium mt-1">
                        {customer.open_balance ? (
                          <span className="text-red-600">₪{customer.open_balance.toFixed(2)}</span>
                        ) : (
                          <span className="text-green-600">₪0.00</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">הזמנות פעילות</div>
                      <div className="text-sm font-medium flex items-center mt-1">
                        <ShoppingBagIcon className="h-4 w-4 ml-1 text-blue-500" />
                        {customer.active_orders_count || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">אחוז הנחה</div>
                      <div className="text-sm font-medium mt-1">
                        {customer.discount_percentage ? 
                          <span className="text-green-600">{customer.discount_percentage}%</span> : 
                          <span className="text-muted-foreground">0%</span>
                        }
                      </div>
                    </div>
                    
                    {customer.city && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">עיר</div>
                        <div className="text-sm">{customer.city}</div>
                      </div>
                    )}
                    
                    {customer.special_requirements && (
                      <div className="col-span-2 mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs font-medium mb-1">דרישות מיוחדות:</div>
                        <div className="text-sm">{customer.special_requirements}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <PencilIcon className="h-4 w-4 ml-2" />
                      עריכה
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-600"
                      onClick={() => handleDeleteCustomer(customer)}
                    >
                      <TrashIcon className="h-4 w-4 ml-2" />
                      מחיקה
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredCustomers?.length === 0 && (
              <Card>
                <CardContent className="flex justify-center py-10">
                  <p className="text-muted-foreground">לא נמצאו לקוחות</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      {renderCustomerDialog(isAddDialogOpen)}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              אישור מחיקת לקוח
            </DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו אינה ניתנת לשחזור.
            </DialogDescription>
          </DialogHeader>
          
          {customerToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-medium">{customerToDelete.name}</p>
                {customerToDelete.phone && (
                  <p className="text-sm text-muted-foreground">{customerToDelete.phone}</p>
                )}
                {customerToDelete.address && (
                  <p className="text-sm text-muted-foreground">{customerToDelete.address}</p>
                )}
              </div>
              
              <p className="text-amber-600 text-sm">
                מחיקת הלקוח תסיר גם את כל ההיסטוריה והנתונים הקשורים אליו.
              </p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ביטול
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isLoading}
              variant="destructive"
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              מחק לקוח
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 