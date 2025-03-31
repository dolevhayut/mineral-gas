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
  SearchIcon, 
  PhoneIcon, 
  UserIcon, 
  PencilIcon, 
  Loader2Icon,
  PlusIcon 
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
  sap_customer_id: string;
  role: string;
  orders_count?: number;
  total_spent?: number;
  can_order_fresh?: boolean;
}

export default function CustomUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    role: "customer",
    can_order_fresh: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch custom users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["custom_users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_users")
        .select(`
          *,
          orders:orders(count)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "שגיאה בטעינת משתמשים",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // If no users found, return mock data
      if (!data || data.length === 0) {
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
          },
        ];
      }

      // Process the data to add orders_count
      return data.map(user => ({
        ...user,
        orders_count: user.orders.length,
        total_spent: 0 // We would need to calculate this from orders if available
      }));
    },
  });

  // Save user mutation
  const saveUser = useMutation({
    mutationFn: async (user: Partial<User>) => {
      const isNewUser = !user.id;
      
      setIsLoading(true);
      
      if (isNewUser) {
        // Create new user
        const { error } = await supabase
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
          ]);
          
        if (error) throw error;
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
      }
      
      setIsLoading(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_users"] });
      toast({
        title: "משתמש נשמר",
        description: "פרטי המשתמש נשמרו בהצלחה",
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
    setIsEditDialogOpen(true);
  };

  const handleAddUser = () => {
    setCurrentUser({
      role: "customer",
      can_order_fresh: true,
    });
    setIsAddDialogOpen(true);
  };

  const renderUserDialog = (isAdd: boolean) => {
    const dialogTitle = isAdd ? "הוספת לקוח חדש" : "עריכת פרטי לקוח";
    const dialogDescription = isAdd 
      ? "הזן את פרטי הלקוח החדש ולחץ שמור כדי להוסיף"
      : "ערוך את פרטי הלקוח ולחץ שמור כדי לעדכן";
    const isOpen = isAdd ? isAddDialogOpen : isEditDialogOpen;
    const setIsOpen = isAdd ? setIsAddDialogOpen : setIsEditDialogOpen;
    
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
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="can_order_fresh">הרשאה למוצרים טריים</Label>
                <p className="text-sm text-muted-foreground">האם הלקוח רשאי להזמין מוצרים טריים</p>
              </div>
              <Switch
                id="can_order_fresh"
                checked={currentUser.can_order_fresh}
                onCheckedChange={(checked) => 
                  setCurrentUser({ ...currentUser, can_order_fresh: checked })
                }
              />
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
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
          <p className="text-muted-foreground">צפה ונהל את הלקוחות בחנות שלך</p>
        </div>
        <Button onClick={handleAddUser} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 ml-2" />
          לקוח חדש
        </Button>
      </div>

      {users && users[0]?.id === "1" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 font-medium">מוצגים נתוני דמו</p>
          <p className="text-yellow-600 text-sm">לא נמצאו לקוחות אמיתיים במסד הנתונים. הנתונים המוצגים הם לצורך הדגמה בלבד.</p>
        </div>
      )}

      <div className="relative">
        <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="חפש לפי שם, טלפון או מזהה לקוח..."
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
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>טלפון</TableHead>
                  <TableHead>מזהה לקוח</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>מוצרים טריים</TableHead>
                  <TableHead>הזמנות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                        {user.phone}
                      </div>
                    </TableCell>
                    <TableCell>{user.sap_customer_id}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "מנהל" : "לקוח"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.can_order_fresh ? "default" : "destructive"}>
                        {user.can_order_fresh ? "רשאי" : "אינו רשאי"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.orders_count}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                        <PencilIcon className="h-4 w-4 ml-2" />
                        עריכה
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {filteredUsers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      לא נמצאו לקוחות
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      {/* User Edit Dialog */}
      {renderUserDialog(false)}
      
      {/* User Add Dialog */}
      {renderUserDialog(true)}
    </div>
  );
} 