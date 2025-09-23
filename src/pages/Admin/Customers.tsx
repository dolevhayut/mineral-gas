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
  PackageIcon
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

interface User {
  id: string;
  name: string;
  phone: string;
}

interface Customer {
  id: string;
  name: string;
  phone?: string;
  user_id?: string;
  address?: string;
  notes?: string;
  active_orders_count?: number;
  total_orders_count?: number;
  can_order_fresh?: boolean;
  discount_percentage?: number;
  associated_user?: {
    id: string;
    name: string;
    phone: string;
  } | null;
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
  const [users, setUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers, isLoading: isCustomersLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      // First, get all customers
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select(`*`)
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

      // For each customer, get their associated user and order counts
      const customersWithDetails = [];
      
      for (const customer of customerData) {
        // Get active orders count (status = 'pending')
        const { data: activeOrdersData, error: activeOrdersError } = await supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("customer_id", customer.id)
          .eq("status", "pending");
        
        // Get total orders count
        const { data: totalOrdersData, error: totalOrdersError } = await supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("customer_id", customer.id);
        
        // Get associated user
        let associatedUser = null;
        if (customer.user_id) {
          const { data: userData } = await supabase
            .from("custom_users")
            .select("id, name, phone, can_order_fresh")
            .eq("id", customer.user_id)
            .maybeSingle();
          
          associatedUser = userData;
        }
        
        customersWithDetails.push({
          ...customer,
          active_orders_count: activeOrdersData?.length || 0,
          total_orders_count: totalOrdersData?.length || 0,
          can_order_fresh: associatedUser?.can_order_fresh || false,
          associated_user: associatedUser
        });
      }
      
      return customersWithDetails;
    },
  });

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      setIsUsersLoading(true);
      try {
        const { data, error } = await supabase
          .from("custom_users")
          .select("id, name, phone")
          .order("name");

        if (error) throw error;
        if (data) {
          setUsers(data);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        toast({
          title: "שגיאה בטעינת משתמשים",
          description: errorMessage,
          variant: "destructive",
          duration: 3000,
        });
      } finally {
        setIsUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

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
      
      // Check if user_id is provided
      if (!customer.user_id) {
        throw new Error("חובה לבחור משתמש משויך");
      }
      
      setIsLoading(true);
      
      // Parse discount_percentage to ensure it's a number
      const discount = customer.discount_percentage !== undefined 
        ? Number(customer.discount_percentage) 
        : null;
      
      if (isNewCustomer) {
        // Create new customer
        const { error } = await supabase
          .from("customers")
          .insert([{ 
            name: customer.name,
            phone: customer.phone,
            address: customer.address,
            notes: customer.notes,
            user_id: customer.user_id,
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
            notes: customer.notes,
            user_id: customer.user_id,
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
    (customer.address && customer.address.toLowerCase().includes(searchQuery.toLowerCase()))
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

  const renderCustomerDialog = (isAdd: boolean) => {
    const dialogTitle = isAdd ? "הוספת לקוח חדש" : "עריכת פרטי לקוח";
    const dialogDescription = isAdd 
      ? "הזן את פרטי הלקוח החדש ולחץ שמור כדי להוסיף"
      : "ערוך את פרטי הלקוח ולחץ שמור כדי לעדכן";
    const isOpen = isAdd ? isAddDialogOpen : isEditDialogOpen;
    const setIsOpen = isAdd ? setIsAddDialogOpen : setIsEditDialogOpen;
    
    // Find the selected user name for display
    const selectedUser = users.find(user => user.id === currentCustomer.user_id);
    
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
              <Label htmlFor="user_id" className="flex items-center">
                משתמש משויך <span className="text-red-500 mr-1">*</span>
              </Label>
              <div className="rtl-select">
                <Select 
                  value={currentCustomer.user_id || ""}
                  onValueChange={(value) => setCurrentCustomer({ 
                    ...currentCustomer, 
                    user_id: value,
                    // Auto-fill name and phone if this is a new customer
                    ...(isAdd && {
                      name: users.find(user => user.id === value)?.name || "",
                      phone: users.find(user => user.id === value)?.phone || ""
                    })
                  })}
                >
                  <SelectTrigger id="user_id" className={!currentCustomer.user_id ? "text-muted-foreground" : ""}>
                    <SelectValue placeholder="בחר משתמש" />
                  </SelectTrigger>
                  <SelectContent>
                    {isUsersLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2Icon className="h-4 w-4 animate-spin ml-2" />
                        טוען משתמשים...
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.phone}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedUser && (
                <div className="text-sm text-muted-foreground">
                  {selectedUser.phone}
                </div>
              )}
            </div>
            
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
              <Label htmlFor="phone">טלפון</Label>
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
              <Label htmlFor="notes">הערות</Label>
              <Input
                id="notes"
                placeholder="הערות נוספות"
                value={currentCustomer.notes || ""}
                onChange={(e) => setCurrentCustomer({ ...currentCustomer, notes: e.target.value })}
              />
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
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={() => saveCustomer.mutate(currentCustomer)}
              disabled={isLoading || !currentCustomer.name || !currentCustomer.user_id}
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
          placeholder="חפש לפי שם, טלפון או כתובת..."
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
                      <TableHead className="whitespace-nowrap">כתובת</TableHead>
                      <TableHead className="whitespace-nowrap">מוצרים טריים</TableHead>
                      <TableHead className="whitespace-nowrap">אחוז הנחה</TableHead>
                      <TableHead className="whitespace-nowrap">הזמנות פעילות</TableHead>
                      <TableHead className="whitespace-nowrap">סה"כ הזמנות</TableHead>
                      <TableHead className="whitespace-nowrap">משתמש משויך</TableHead>
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
                          {customer.address || "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={customer.can_order_fresh ? "default" : "destructive"}>
                            {customer.can_order_fresh ? "רשאי" : "אינו רשאי"}
                          </Badge>
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
                        <TableCell className="whitespace-nowrap">
                          {customer.total_orders_count}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {customer.associated_user ? (
                            <div>
                              <div className="font-medium">{customer.associated_user.name}</div>
                              {customer.associated_user.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {customer.associated_user.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
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
                        <TableCell colSpan={8} className="h-24 text-center">
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
                    <Badge variant={customer.can_order_fresh ? "default" : "destructive"}>
                      {customer.can_order_fresh ? "טרי" : "קפוא"}
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
                      <div className="text-xs text-muted-foreground">הזמנות פעילות</div>
                      <div className="text-sm font-medium flex items-center mt-1">
                        <ShoppingBagIcon className="h-4 w-4 ml-1 text-blue-500" />
                        {customer.active_orders_count || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">סה"כ הזמנות</div>
                      <div className="text-sm font-medium flex items-center mt-1">
                        <PackageIcon className="h-4 w-4 ml-1 text-muted-foreground" />
                        {customer.total_orders_count || 0}
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
                    
                    {customer.associated_user && (
                      <div className="col-span-2 mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs font-medium mb-1">משתמש משויך:</div>
                        <div className="text-sm font-bold">{customer.associated_user.name}</div>
                        {customer.associated_user.phone && (
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <PhoneIcon className="h-3 w-3 ml-1" />
                            {customer.associated_user.phone}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {customer.address && (
                      <div className="col-span-2 mt-1">
                        <div className="text-xs text-muted-foreground">כתובת</div>
                        <div className="text-sm">{customer.address}</div>
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