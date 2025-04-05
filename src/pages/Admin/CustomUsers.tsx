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
  UserIcon, 
  PencilIcon, 
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  AlertTriangleIcon,
  RefreshCwIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  user_id: string;
  orders?: { count: number }[];
}

interface Product {
  id: string;
  name: string;
  category?: string;
  is_frozen: boolean;
}

interface User {
  id: string;
  name: string;
  phone: string;
  sap_customer_id: string;
  role: string;
  orders_count?: number;
  total_spent?: number;
  can_order_fresh?: boolean;
  customer?: Customer | null;
  allowed_fresh_products?: string[];
}

export default function CustomUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    role: "customer",
    can_order_fresh: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [freshProducts, setFreshProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { login } = useAuth();
  const navigate = useNavigate();

  // Fetch fresh products
  useEffect(() => {
    const fetchFreshProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, is_frozen")
        .eq("is_frozen", false);
        
      if (error) {
        console.error("Error fetching fresh products:", error);
        return;
      }
      
      setFreshProducts(data || []);
    };
    
    fetchFreshProducts();
  }, []);

  // Fetch custom users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["custom_users"],
    queryFn: async () => {
      // First, get all custom users
      const { data: userData, error: userError } = await supabase
        .from("custom_users")
        .select(`*`)
        .order("created_at", { ascending: false });

      if (userError) {
        toast({
          title: "שגיאה בטעינת משתמשים",
          description: userError.message,
          variant: "destructive",
        });
        throw userError;
      }

      // If no users found, return mock data
      if (!userData || userData.length === 0) {
        return [
          {
            id: "1",
            name: "ישראל ישראלי",
            phone: "+972501234567",
            sap_customer_id: "SAP001",
            role: "admin",
            orders_count: 5,
            total_spent: 600,
            can_order_fresh: true,
            allowed_fresh_products: [],
            customer: null,
          },
          {
            id: "2",
            name: "יעקב יעקובי",
            phone: "+972502345678",
            sap_customer_id: "SAP002",
            role: "customer",
            orders_count: 3,
            total_spent: 450,
            can_order_fresh: true,
            allowed_fresh_products: [],
            customer: null,
          },
          {
            id: "3",
            name: "רחל רחלי",
            phone: "+972503456789",
            sap_customer_id: "SAP003",
            role: "customer",
            orders_count: 2,
            total_spent: 360,
            can_order_fresh: false,
            allowed_fresh_products: [],
            customer: null,
          },
        ];
      }

      // For each user, get their associated customer and allowed products
      const usersWithCustomers = [];
      
      for (const user of userData) {
        // Get customer for this user
        const { data: customerData } = await supabase
          .from("customers")
          .select(`*, orders(count)`)
          .eq("user_id", user.id)
          .maybeSingle();
        
        // Get allowed fresh products for this user
        const { data: allowedProductsData } = await supabase
          .from("custom_user_products")
          .select("product_id")
          .eq("user_id", user.id);
          
        // Get orders count for this customer
        let ordersCount = 0;
        if (customerData) {
          ordersCount = customerData.orders[0]?.count || 0;
        }
        
        usersWithCustomers.push({
          ...user,
          orders_count: ordersCount,
          total_spent: 0,
          customer: customerData,
          allowed_fresh_products: allowedProductsData?.map(item => item.product_id) || [],
        });
      }
      
      return usersWithCustomers;
    },
  });

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ["custom_users"] })
      .then(() => {
        toast({
          title: "רשימת המשתמשים עודכנה",
          duration: 2000,
        });
        setIsRefreshing(false);
      });
  };

  // Save user mutation
  const saveUser = useMutation({
    mutationFn: async (user: Partial<User>) => {
      const isNewUser = !user.id;
      
      setIsLoading(true);
      
      try {
        if (isNewUser) {
          // Create new user
          const { data: newUser, error } = await supabase
            .from("custom_users")
            .insert([
              { 
                name: user.name,
                phone: user.phone,
                sap_customer_id: user.sap_customer_id,
                role: user.role,
                can_order_fresh: user.can_order_fresh,
                // For a new user we'd need to set a temporary password
                password: "tempPassword123" 
              }
            ])
            .select();
            
          if (error) throw error;
          
          // If fresh products selected and can_order_fresh is true, save the product permissions
          if (user.can_order_fresh && selectedProducts.length > 0 && newUser?.[0]?.id) {
            const productPermissions = selectedProducts.map(productId => ({
              user_id: newUser[0].id,
              product_id: productId
            }));
            
            const { error: permissionsError } = await supabase
              .from("custom_user_products")
              .insert(productPermissions);
              
            if (permissionsError) throw permissionsError;
          }
        } else {
          // Update existing user
          const { error } = await supabase
            .from("custom_users")
            .update({ 
              name: user.name,
              phone: user.phone,
              sap_customer_id: user.sap_customer_id,
              role: user.role,
              can_order_fresh: user.can_order_fresh,
            })
            .eq("id", user.id);
            
          if (error) throw error;
          
          // Handle product permissions
          if (user.id) {
            // First delete existing permissions
            const { error: deleteError } = await supabase
              .from("custom_user_products")
              .delete()
              .eq("user_id", user.id);
              
            if (deleteError) throw deleteError;
            
            // If can order fresh and products selected, add new permissions
            if (user.can_order_fresh && selectedProducts.length > 0) {
              const productPermissions = selectedProducts.map(productId => ({
                user_id: user.id,
                product_id: productId
              }));
              
              const { error: permissionsError } = await supabase
                .from("custom_user_products")
                .insert(productPermissions);
                
              if (permissionsError) throw permissionsError;
            }
          }
        }
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_users"] });
      toast({
        title: "משתמש נשמר",
        description: "פרטי המשתמש נשמרו בהצלחה",
        duration: 2000,
      });
      setIsEditDialogOpen(false);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "שגיאה בשמירת משתמש",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      setIsLoading(true);
      
      const { error } = await supabase
        .from("custom_users")
        .delete()
        .eq("id", userId);
        
      if (error) throw error;
      
      setIsLoading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_users"] });
      toast({
        title: "משתמש נמחק",
        description: "המשתמש נמחק בהצלחה",
        duration: 2000,
      });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      setIsLoading(false);
      toast({
        title: "שגיאה במחיקת משתמש",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    },
  });

  const filteredUsers = users?.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone.includes(searchQuery) ||
    (user.sap_customer_id && user.sap_customer_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setSelectedProducts(user.allowed_fresh_products || []);
    setIsEditDialogOpen(true);
  };

  const handleAddUser = () => {
    setCurrentUser({
      role: "customer",
      can_order_fresh: true,
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    // מניעת מחיקת משתמש מסוג מנהל
    if (user.role === "admin") {
      toast({
        title: "לא ניתן למחוק מנהל",
        description: "לא ניתן למחוק משתמשים מסוג מנהל",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id);
    }
  };

  const loginAsUser = async (user: User) => {
    try {
      setIsLoading(true);
      const success = await login(user.sap_customer_id, user.phone);
      
      if (success) {
        toast({
          title: "התחברות בוצעה בהצלחה",
          description: `התחברת בהצלחה בתור ${user.name}`,
        });
        
        // Navigate to the appropriate dashboard based on user role
        navigate(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } else {
        toast({
          title: "התחברות נכשלה",
          description: "אירעה שגיאה בעת ההתחברות",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error logging in as user:", error);
      toast({
        title: "שגיאת התחברות",
        description: `אירעה שגיאה בהתחברות: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const renderUserDialog = (isAdd: boolean) => {
    const dialogTitle = isAdd ? "הוספת לקוח חדש" : "עריכת פרטי לקוח";
    const dialogDescription = isAdd 
      ? "הזן את פרטי הלקוח החדש ולחץ שמור כדי להוסיף"
      : "ערוך את פרטי הלקוח ולחץ שמור כדי לעדכן";
    const isOpen = isAdd ? isAddDialogOpen : isEditDialogOpen;
    const setIsOpen = isAdd ? setIsAddDialogOpen : setIsEditDialogOpen;
    
    // Group fresh products by category
    const productsByCategory: Record<string, Product[]> = {};
    freshProducts.forEach(product => {
      const category = product.category || "אחר";
      if (!productsByCategory[category]) {
        productsByCategory[category] = [];
      }
      productsByCategory[category].push(product);
    });
    
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto" side="left">
          <SheetHeader>
            <SheetTitle>{dialogTitle}</SheetTitle>
            <SheetDescription>
              {dialogDescription}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={currentUser.name || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">מספר טלפון</Label>
              <Input
                id="phone"
                value={currentUser.phone || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
                placeholder="+972501234567"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sap_customer_id">מזהה לקוח SAP</Label>
              <Input
                id="sap_customer_id"
                value={currentUser.sap_customer_id || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, sap_customer_id: e.target.value })}
                placeholder="SAP001"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">תפקיד</Label>
              <div className="rtl-select">
                <Select 
                  value={currentUser.role}
                  onValueChange={(value) => setCurrentUser({ 
                    ...currentUser, 
                    role: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר תפקיד" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">לקוח</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="can_order_fresh">הרשאה למוצרים טריים</Label>
                <p className="text-sm text-muted-foreground">האם הלקוח רשאי להזמין מוצרים טריים</p>
              </div>
              <div className="ltr-switch">
                <Switch
                  id="can_order_fresh"
                  checked={currentUser.can_order_fresh}
                  onCheckedChange={(checked) => 
                    setCurrentUser({ ...currentUser, can_order_fresh: checked })
                  }
                />
              </div>
            </div>
            
            {/* Fresh products section */}
            {currentUser.can_order_fresh && freshProducts.length > 0 && (
              <div className="mt-4">
                <Label className="text-base text-right block">בחירת מוצרים טריים מותרים</Label>
                <p className="text-sm text-muted-foreground mb-2 text-right">
                  סמן את המוצרים הטריים שהלקוח יוכל להזמין
                </p>
                
                <ScrollArea className="h-72 rounded-md border p-4">
                  <div dir="rtl">
                    {Object.entries(productsByCategory).map(([category, products]) => (
                      <div key={category} className="mb-4">
                        <h4 className="font-medium text-sm text-right">{category}</h4>
                        <Separator className="my-2" />
                        <div>
                          {products.map(product => (
                            <div 
                              key={product.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                padding: '4px 0',
                                direction: 'rtl'
                              }}
                            >
                              <Switch
                                id={`product-${product.id}`}
                                checked={selectedProducts.includes(product.id)}
                                onCheckedChange={() => handleProductSelection(product.id)}
                                style={{ marginLeft: '12px' }}
                              />
                              <Label 
                                htmlFor={`product-${product.id}`}
                                style={{
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  textAlign: 'right',
                                  flex: 1
                                }}
                              >
                                {product.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-between mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProducts(freshProducts.map(p => p.id))}
                  >
                    בחר הכל
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProducts([])}
                  >
                    נקה הכל
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <SheetFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ביטול
            </Button>
            <Button 
              onClick={() => saveUser.mutate(currentUser)}
              disabled={isLoading}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading && <Loader2Icon className="ml-2 h-4 w-4 animate-spin" />}
              שמור
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
          <p className="text-muted-foreground">צפה ונהל את המשתמשים במערכת</p>
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
          <Button onClick={handleAddUser} className="flex-1 sm:flex-auto">
            <PlusIcon className="h-4 w-4 ml-2" />
            משתמש חדש
          </Button>
        </div>
      </div>

      {users && users[0]?.id === "1" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 font-medium">מוצגים נתוני דמו</p>
          <p className="text-yellow-600 text-sm">לא נמצאו משתמשים אמיתיים במסד הנתונים. הנתונים המוצגים הם לצורך הדגמה בלבד.</p>
        </div>
      )}

      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="חפש לפי שם, טלפון או מזהה..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-3 pr-10"
        />
      </div>

      {isUsersLoading ? (
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
                      <TableHead className="whitespace-nowrap text-right">שם</TableHead>
                      <TableHead className="whitespace-nowrap text-right">טלפון</TableHead>
                      <TableHead className="whitespace-nowrap text-right">מזהה</TableHead>
                      <TableHead className="whitespace-nowrap text-right">תפקיד</TableHead>
                      <TableHead className="whitespace-nowrap text-right">מוצרים טריים</TableHead>
                      <TableHead className="whitespace-nowrap text-right">לקוח משויך</TableHead>
                      <TableHead className="whitespace-nowrap text-right">הזמנות</TableHead>
                      <TableHead className="whitespace-nowrap text-right">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium whitespace-nowrap">{user.name}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                            {user.phone}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{user.sap_customer_id}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "מנהל" : "משתמש"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge variant={user.can_order_fresh ? "default" : "destructive"}>
                            {user.can_order_fresh ? "רשאי" : "אינו רשאי"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {user.customer ? (
                            <div>
                              <div className="font-medium">{user.customer.name}</div>
                              {user.customer.phone && (
                                <div className="text-xs text-muted-foreground">
                                  {user.customer.phone}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{user.orders_count}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                              <PencilIcon className="h-4 w-4 ml-2" />
                              עריכה
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteUser(user)}
                              style={{display: user.role === "admin" ? "none" : "flex"}}
                            >
                              <TrashIcon className="h-4 w-4 ml-2" />
                              מחיקה
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => loginAsUser(user)}
                            >
                              <UserIcon className="h-4 w-4 ml-2" />
                              התחבר
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {filteredUsers?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          לא נמצאו משתמשים
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
            {filteredUsers?.map((user) => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role === "admin" ? "מנהל" : "משתמש"}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <PhoneIcon className="h-3 w-3 ml-1" />
                    {user.phone}
                  </div>
                </CardHeader>
                <CardContent className="pb-4 pt-0">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground">מזהה</div>
                      <div className="text-sm font-medium">{user.sap_customer_id || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">הזמנות</div>
                      <div className="text-sm font-medium">{user.orders_count || 0}</div>
                    </div>
                    
                    {user.customer && (
                      <div className="col-span-2 mt-2 p-3 bg-muted rounded-md">
                        <div className="text-xs font-medium mb-1">לקוח משויך:</div>
                        <div className="text-sm font-bold">{user.customer.name}</div>
                        {user.customer.phone && (
                          <div className="text-xs text-muted-foreground flex items-center mt-1">
                            <PhoneIcon className="h-3 w-3 ml-1" />
                            {user.customer.phone}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="col-span-2">
                      <div className="text-xs text-muted-foreground">מוצרים טריים</div>
                      <Badge variant={user.can_order_fresh ? "outline" : "destructive"} className="mt-1">
                        {user.can_order_fresh ? "רשאי להזמין" : "אינו רשאי להזמין"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEditUser(user)}
                    >
                      <PencilIcon className="h-4 w-4 ml-2" />
                      עריכה
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-600"
                      onClick={() => handleDeleteUser(user)}
                      style={{display: user.role === "admin" ? "none" : "flex"}}
                    >
                      <TrashIcon className="h-4 w-4 ml-2" />
                      מחיקה
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-blue-600"
                      onClick={() => loginAsUser(user)}
                    >
                      <UserIcon className="h-4 w-4 ml-2" />
                      התחבר
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredUsers?.length === 0 && (
              <Card>
                <CardContent className="flex justify-center py-10">
                  <p className="text-muted-foreground">לא נמצאו משתמשים</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
      
      {/* User Edit Dialog */}
      {renderUserDialog(false)}
      
      {/* User Add Dialog */}
      {renderUserDialog(true)}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              אישור מחיקת משתמש
            </DialogTitle>
            <DialogDescription>
              האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה ניתנת לשחזור.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="py-4">
              <div className="bg-muted p-4 rounded-md mb-4">
                <p className="font-medium">{userToDelete.name}</p>
                <p className="text-sm text-muted-foreground">{userToDelete.phone}</p>
                <p className="text-sm text-muted-foreground">מזהה: {userToDelete.sap_customer_id}</p>
              </div>
              
              <p className="text-amber-600 text-sm">
                מחיקת המשתמש תסיר גם את כל ההיסטוריה והנתונים הקשורים אליו.
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
              מחק משתמש
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 