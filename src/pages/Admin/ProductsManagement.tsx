
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { sampleProducts, sampleCategories } from "@/lib/data";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreVerticalIcon,
  PencilIcon,
  PlusCircleIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const ProductsManagement = () => {
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAvailabilityToggle = (id: string) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id
          ? { ...product, available: !product.available }
          : product
      )
    );
    toast({
      title: "Product Updated",
      description: "Product availability has been updated.",
    });
  };

  const handleFeaturedToggle = (id: string) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === id
          ? { ...product, featured: !product.featured }
          : product
      )
    );
    toast({
      title: "Product Updated",
      description: "Featured status has been updated.",
    });
  };

  const handleDelete = () => {
    if (currentProduct) {
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== currentProduct.id)
      );
      setIsDeleteDialogOpen(false);
      setCurrentProduct(null);
      toast({
        title: "Product Deleted",
        description: "The product has been deleted successfully.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-serif font-bold">Products Management</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-bottle-600 hover:bg-bottle-700">
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product in your catalog
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <FormLabel htmlFor="name">Product Name</FormLabel>
                  <Input id="name" placeholder="Enter product name" />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="price">Price</FormLabel>
                  <Input id="price" placeholder="0.00" type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="category">Category</FormLabel>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {sampleCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Input id="description" placeholder="Enter description" />
                </div>
                <div className="space-y-2">
                  <FormLabel htmlFor="image">Image URL</FormLabel>
                  <Input id="image" placeholder="Enter image URL" />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="available" />
                  <label
                    htmlFor="available"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Available
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="featured" />
                  <label
                    htmlFor="featured"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Featured
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    toast({
                      title: "Product Added",
                      description: "New product has been created successfully.",
                    });
                  }}
                  className="bg-bottle-600 hover:bg-bottle-700"
                >
                  Add Product
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
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
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-center">Available</TableHead>
                <TableHead className="text-center">Featured</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-12 h-12">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {sampleCategories.find((c) => c.id === product.category)?.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.available}
                      onCheckedChange={() => handleAvailabilityToggle(product.id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={product.featured}
                      onCheckedChange={() => handleFeaturedToggle(product.id)}
                    />
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
                          onClick={() => {
                            setCurrentProduct(product);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <PencilIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            setCurrentProduct(product);
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
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No products found matching your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <FormLabel htmlFor="edit-name">Product Name</FormLabel>
              <Input
                id="edit-name"
                defaultValue={currentProduct?.name}
                placeholder="Enter product name"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-price">Price</FormLabel>
              <Input
                id="edit-price"
                defaultValue={currentProduct?.price}
                placeholder="0.00"
                type="number"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-category">Category</FormLabel>
              <Select defaultValue={currentProduct?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {sampleCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-description">Description</FormLabel>
              <Input
                id="edit-description"
                defaultValue={currentProduct?.description}
                placeholder="Enter description"
              />
            </div>
            <div className="space-y-2">
              <FormLabel htmlFor="edit-image">Image URL</FormLabel>
              <Input
                id="edit-image"
                defaultValue={currentProduct?.image}
                placeholder="Enter image URL"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-available" defaultChecked={currentProduct?.available} />
              <label
                htmlFor="edit-available"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Available
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-featured" defaultChecked={currentProduct?.featured} />
              <label
                htmlFor="edit-featured"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Featured
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsEditDialogOpen(false);
                toast({
                  title: "Product Updated",
                  description: "The product has been updated successfully.",
                });
              }}
              className="bg-bottle-600 hover:bg-bottle-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ProductsManagement;
