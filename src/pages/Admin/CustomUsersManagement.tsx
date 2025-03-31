import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPhoneNumber } from "@/lib/utils";
import { 
  MoreVerticalIcon, 
  PencilIcon, 
  PlusCircleIcon, 
  SearchIcon, 
  TrashIcon, 
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormLabel } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CustomUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  sap_customer_id: string | null;
  is_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const CustomUsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState("customer");
  const [formSapId, setFormSapId] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formIsVerified, setFormIsVerified] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_users')
        .select('*') as { data: CustomUser[] | null, error: any };

      if (error) {
        throw error;
      }

      if (data) {
        const typedUsers: User[] = data.map(user => ({
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: user.role as 'admin' | 'customer',
          sapCustomerId: user.sap_customer_id,
          isVerified: user.is_verified,
          createdAt: user.created_at
        }));
        setUsers(typedUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormName("");
    setFormPhone("");
    setFormRole("customer");
    setFormSapId("");
    setFormPassword("");
    setFormIsVerified(false);
  };

  const handleEditDialogOpen = (user: User) => {
    setCurrentUser(user);
    setFormName(user.name);
    setFormPhone(user.phone);
    setFormRole(user.role);
    setFormSapId(user.sapCustomerId || "");
    setFormIsVerified(user.isVerified);
    setFormPassword("");
    setIsEditDialogOpen(true);
  };

  const handleAddUser = async () => {
    try {
      if (!formPassword) {
        toast({
          title: "Error",
          description: "Password is required",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.rpc('add_custom_user', {
        user_name: formName,
        user_phone: formPhone,
        user_password: formPassword,
        user_role: formRole as 'admin' | 'customer',
        user_sap_id: formSapId || null,
        user_is_verified: formIsVerified
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User added successfully",
      });
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!currentUser) return;

    try {
      if (formPassword) {
        const { data, error } = await supabase.rpc('update_user_with_password', {
          user_id: currentUser.id,
          user_name: formName,
          user_phone: formPhone,
          user_password: formPassword,
          user_role: formRole as 'admin' | 'customer',
          user_sap_id: formSapId || null,
          user_is_verified: formIsVerified
        });

        if (error) {
          throw error;
        }
      } else {
        const updateData: any = {
          name: formName,
          phone: formPhone,
          role: formRole,
          sap_customer_id: formSapId || null,
          is_verified: formIsVerified,
        };

        const { error } = await supabase
          .from('custom_users')
          .update(updateData)
          .eq('id', currentUser.id);

        if (error) {
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('custom_users')
        .delete()
        .eq('id', currentUser.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      (user.sapCustomerId && user.sapCustomerId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold">Custom Users Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-bakery-600 hover:bg-bakery-700">
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="name">Full Name</FormLabel>
                  <Input 
                    id="name" 
                    placeholder="Enter full name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="phone">Phone Number</FormLabel>
                  <Input 
                    id="phone" 
                    placeholder="+1234567890"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="role">Role</FormLabel>
                  <Select 
                    value={formRole} 
                    onValueChange={setFormRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="sapId">SAP Customer ID</FormLabel>
                  <Input 
                    id="sapId" 
                    placeholder="SAP123" 
                    value={formSapId}
                    onChange={(e) => setFormSapId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)} 
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isVerified"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-bakery-600 focus:ring-bakery-500"
                  />
                  <FormLabel htmlFor="isVerified">User is verified</FormLabel>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsAddDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddUser}
                  className="bg-bakery-600 hover:bg-bakery-700"
                >
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name, phone or SAP ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>SAP ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-bakery-100 text-bakery-800">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatPhoneNumber(user.phone)}</TableCell>
                    <TableCell>{user.sapCustomerId || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "admin"
                            ? "border-bakery-500 text-bakery-700 bg-bakery-50"
                            : "border-gray-300"
                        }
                      >
                        {user.role === "admin" ? "Admin" : "Customer"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isVerified ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditDialogOpen(user)}
                          >
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setCurrentUser(user);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user account details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="edit-name">Full Name</FormLabel>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-phone">Phone Number</FormLabel>
              <Input
                id="edit-phone"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-role">Role</FormLabel>
              <Select 
                value={formRole} 
                onValueChange={setFormRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-sap">SAP Customer ID</FormLabel>
              <Input
                id="edit-sap"
                value={formSapId}
                onChange={(e) => setFormSapId(e.target.value)}
                placeholder="SAP123"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-password">Reset Password</FormLabel>
              <Input
                id="edit-password"
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Enter new password (leave blank to keep current)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isVerified"
                checked={formIsVerified}
                onChange={(e) => setFormIsVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-bakery-600 focus:ring-bakery-500"
              />
              <FormLabel htmlFor="edit-isVerified">User is verified</FormLabel>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsEditDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="bg-bakery-600 hover:bg-bakery-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CustomUsersManagement;
