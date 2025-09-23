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
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  Loader2Icon,
  UserIcon,
  FilterIcon,
  CheckCircleIcon,
  XCircleIcon,
  MailIcon,
  PhoneIcon,
  KeyIcon,
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface User {
  id: string;
  name: string;
  phone: string;
  sap_customer_id: string;
  role: string;
  is_verified: boolean;
  created_at: string;
}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    role: "customer",
    is_verified: true,
  });
  const [filterRole, setFilterRole] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
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
            id: "demo-user-1",
            name: "ישראל ישראלי",
            phone: "+972501234567",
            sap_customer_id: "SAP123",
            role: "admin",
            is_verified: true,
            created_at: new Date().toISOString()
          },
          {
            id: "demo-user-2",
            name: "יעקב יעקובי",
            phone: "+972502345678",
            sap_customer_id: "SAP456",
            role: "customer",
            is_verified: true,
            created_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: "demo-user-3",
            name: "רחל רחלי",
            phone: "+972503456789",
            sap_customer_id: "SAP789",
            role: "customer",
            is_verified: false,
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ];
      }

      return data as User[];
    },
  });

  // Save user mutation
  const saveUser = useMutation({
    mutationFn: async (user: Partial<User>) => {
      setIsLoading(true);

      // Check if phone already exists for new users
      if (!user.id) {
        const { data: existingUser } = await supabase
          .from("customers")
          .select("id")
          .eq("phone", user.phone)
          .maybeSingle();

        if (existingUser) {
          throw new Error("מספר טלפון כבר קיים במערכת");
        }
      }

      // For new users, we need to set a default password
      let password = undefined;
      if (!user.id) {
        // Generate a random password or use a default one
        // This is temporary - in a real app, you might want to generate and email this to the user
        password = "default123";
      }

      if (user.id) {
        // Update existing user
        const { error } = await supabase
          .from("customers")
          .update({ 
            name: user.name,
            phone: user.phone,
            sap_customer_id: user.sap_customer_id,
            role: user.role,
            is_verified: user.is_verified,
          })
          .eq("id", user.id);

        if (error) throw error;
        return user;
      } else {
        // Create new user
        const { error, data } = await supabase
          .from("customers")
          .insert([{ 
            name: user.name,
            phone: user.phone,
            sap_customer_id: user.sap_customer_id,
            role: user.role,
            is_verified: user.is_verified,
            password: password,
          }])
          .select();

        if (error) throw error;
        return data[0];
      }
    },
    onSuccess: () => {
      setIsLoading(false);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: currentUser.id ? "משתמש עודכן" : "משתמש נוסף",
        description: currentUser.id ? "המשתמש עודכן בהצלחה" : "המשתמש נוסף בהצלחה",
      });
      resetForm();
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

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "משתמש נמחק",
        description: "המשתמש נמחק בהצלחה",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה במחיקת משתמש",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle user verification status mutation
  const toggleVerification = useMutation({
    mutationFn: async ({ id, is_verified }: { id: string; is_verified: boolean }) => {
      const { error } = await supabase
        .from("customers")
        .update({ is_verified })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast({
        title: "שגיאה בעדכון סטטוס אימות",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery) ||
      user.sap_customer_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה?")) {
      deleteUser.mutate(id);
    }
  };

  const handleEdit = (user: User) => {
    setCurrentUser(user);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setCurrentUser({
      role: "customer",
      is_verified: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name[0];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול משתמשים</h1>
          <p className="text-muted-foreground">נהל את המשתמשים במערכת</p>
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto">
          <PlusIcon className="h-4 w-4 ml-2" />
          משתמש חדש
        </Button>
      </div>

      {users && users[0]?.id.startsWith("demo-") && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-700 font-medium">מוצגים נתוני דמו</p>
          <p className="text-yellow-600 text-sm">לא נמצאו משתמשים אמיתיים במסד הנתונים. הנתונים המוצגים הם לצורך הדגמה בלבד.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חפש לפי שם, טלפון או מזהה לקוח..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          <Select
            value={filterRole}
            onValueChange={setFilterRole}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סנן לפי תפקיד" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל התפקידים</SelectItem>
              <SelectItem value="admin">מנהלים</SelectItem>
              <SelectItem value="customer">לקוחות</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isUsersLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers?.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 bg-primary/10">
                      <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "מנהל" : "לקוח"}
                        </Badge>
                        <Badge 
                          variant={user.is_verified ? "outline" : "destructive"}
                          className="mr-2 cursor-pointer"
                          onClick={() => toggleVerification.mutate({
                            id: user.id,
                            is_verified: !user.is_verified
                          })}
                        >
                          {user.is_verified ? 
                            <><CheckCircleIcon className="h-3 w-3 ml-1" /> מאומת</> : 
                            <><XCircleIcon className="h-3 w-3 ml-1" /> לא מאומת</>
                          }
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <PhoneIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                    <span dir="ltr">{user.phone}</span>
                  </div>
                  
                  {user.sap_customer_id && (
                    <div className="flex items-center text-sm">
                      <KeyIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                      <span>{user.sap_customer_id || "אין מזהה לקוח"}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>נוצר ב-{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-end gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEdit(user)}
                >
                  <PencilIcon className="h-4 w-4 ml-2" />
                  עריכה
                </Button>
                {user.role !== "admin" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(user.id)}
                  >
                    <TrashIcon className="h-4 w-4 ml-2" />
                    מחיקה
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {filteredUsers?.length === 0 && !isUsersLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-xl font-medium text-muted-foreground">לא נמצאו משתמשים</p>
          <p className="text-sm text-muted-foreground mb-6">נסה לשנות את החיפוש או להוסיף משתמשים חדשים</p>
          <Button onClick={handleAddNew}>
            <PlusIcon className="h-4 w-4 ml-2" />
            הוסף משתמש חדש
          </Button>
        </div>
      )}

      {/* User Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{currentUser.id ? "עריכת משתמש" : "הוספת משתמש חדש"}</DialogTitle>
            <DialogDescription>
              {currentUser.id 
                ? "ערוך את פרטי המשתמש ולחץ שמור כדי לעדכן"
                : "הזן את פרטי המשתמש החדש ולחץ שמור כדי להוסיף"}
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
                dir="ltr"
                value={currentUser.phone || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, phone: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="sap_customer_id">מזהה לקוח</Label>
              <Input
                id="sap_customer_id"
                value={currentUser.sap_customer_id || ""}
                onChange={(e) => setCurrentUser({ ...currentUser, sap_customer_id: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="role">תפקיד</Label>
              <Select 
                value={currentUser.role || "customer"}
                onValueChange={(value) => setCurrentUser({ 
                  ...currentUser, 
                  role: value 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">מנהל</SelectItem>
                  <SelectItem value="customer">לקוח</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="is_verified">סטטוס אימות</Label>
              <Select 
                value={currentUser.is_verified ? "true" : "false"}
                onValueChange={(value) => setCurrentUser({ 
                  ...currentUser, 
                  is_verified: value === "true" 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">מאומת</SelectItem>
                  <SelectItem value="false">לא מאומת</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
} 