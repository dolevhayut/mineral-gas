import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Wrench, 
  Calendar, 
  MapPin, 
  Clock, 
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  SearchIcon,
  FilterIcon,
  Eye,
  X,
  ArrowRight,
  Plus,
  Upload
} from "lucide-react";

interface ServiceRequest {
  id: string;
  customer_id: string;
  title: string;
  description: string;
  image_url?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  service_type: string;
  location?: string;
  preferred_date?: string;
  preferred_time_slot?: string;
  technician_notes?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  city?: string;
  address?: string;
  customers?: {
    name: string;
    phone: string;
  };
}

export default function ServiceRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  // New service request form state
  const [newRequest, setNewRequest] = useState({
    customer_id: "",
    title: "",
    description: "",
    service_type: "maintenance",
    priority: "normal" as ServiceRequest['priority'],
    preferred_date: "",
    preferred_time_slot: "",
    city: "",
    address: "",
    customer_phone: "",
    technician_notes: ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

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

  // Fetch customers for dropdown
  const { data: customersData } = useQuery({
    queryKey: ["customers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, city, address")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch service requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["service-requests", statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from("service_requests")
        .select(`
          *,
          customers(name, phone)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceRequest[];
    },
  });

  // Create new service request
  const createRequest = useMutation({
    mutationFn: async () => {
      if (!newRequest.customer_id || !newRequest.description) {
        throw new Error("יש למלא לקוח ותיאור");
      }

      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${newRequest.customer_id}_${Date.now()}.${fileExt}`;
        const filePath = `service-requests/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(filePath, selectedImage, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          toast({
            title: "שגיאה בהעלאת תמונה",
            description: uploadError.message,
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('service-images')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from("service_requests")
        .insert({
          customer_id: newRequest.customer_id,
          title: newRequest.title || `${newRequest.service_type} - ${newRequest.city || 'לא צוין'}`,
          description: newRequest.description,
          service_type: newRequest.service_type,
          priority: newRequest.priority,
          preferred_date: newRequest.preferred_date || null,
          preferred_time_slot: newRequest.preferred_time_slot || null,
          city: newRequest.city || null,
          address: newRequest.address || null,
          customer_phone: newRequest.customer_phone || null,
          technician_notes: newRequest.technician_notes || null,
          image_url: imageUrl,
          status: 'pending'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({ title: "קריאת השירות נוצרה בהצלחה" });
      setIsCreateDialogOpen(false);
      resetNewRequestForm();
    },
    onError: (error) => {
      toast({ 
        title: "שגיאה ביצירת קריאת שירות", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Update service request
  const updateRequest = useMutation({
    mutationFn: async (updatedRequest: Partial<ServiceRequest> & { id: string }) => {
      const { error } = await supabase
        .from("service_requests")
        .update({
          ...updatedRequest,
          updated_at: new Date().toISOString(),
          ...(updatedRequest.status === 'completed' && {
            completed_at: new Date().toISOString()
          })
        })
        .eq("id", updatedRequest.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({ title: "בקשת השירות עודכנה בהצלחה" });
      setIsDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast({ 
        title: "שגיאה בעדכון בקשת השירות", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const getStatusBadge = (status: ServiceRequest['status']) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "ממתינה" },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: Wrench, label: "בטיפול" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "הושלמה" },
      cancelled: { color: "bg-red-100 text-red-800", icon: XCircle, label: "בוטלה" }
    };
    const badge = badges[status];
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} flex items-center gap-1 text-sm px-3 py-1`}>
        <Icon className="h-4 w-4" />
        {badge.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ServiceRequest['priority']) => {
    const badges = {
      low: { color: "bg-gray-100 text-gray-800", label: "נמוכה" },
      normal: { color: "bg-blue-100 text-blue-800", label: "רגילה" },
      high: { color: "bg-orange-100 text-orange-800", label: "גבוהה" },
      urgent: { color: "bg-red-100 text-red-800", label: "דחופה" }
    };
    const badge = badges[priority];
    return (
      <Badge className={`${badge.color} text-sm px-3 py-1`}>
        {badge.label}
      </Badge>
    );
  };

  const filteredRequests = requests?.filter(request => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      request.title.toLowerCase().includes(searchLower) ||
      request.description.toLowerCase().includes(searchLower) ||
      request.customers?.name.toLowerCase().includes(searchLower) ||
      request.customer_phone?.includes(searchTerm)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-bottle-600" />
      </div>
    );
  }

  const handleViewRequest = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };

  const handleSaveRequest = () => {
    if (selectedRequest) {
      updateRequest.mutate(selectedRequest);
    }
  };

  const handleMarkAsCompleted = () => {
    if (selectedRequest) {
      updateRequest.mutate({
        ...selectedRequest,
        status: 'completed',
        completed_at: new Date().toISOString()
      });
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedRequest(null);
  };

  const resetNewRequestForm = () => {
    setNewRequest({
      customer_id: "",
      title: "",
      description: "",
      service_type: "maintenance",
      priority: "normal",
      preferred_date: "",
      preferred_time_slot: "",
      city: "",
      address: "",
      customer_phone: "",
      technician_notes: ""
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "שגיאה",
          description: "גודל התמונה חייב להיות פחות מ-5MB",
          variant: "destructive"
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customersData?.find(c => c.id === customerId);
    if (customer) {
      setNewRequest({
        ...newRequest,
        customer_id: customerId,
        customer_phone: customer.phone,
        city: customer.city || "",
        address: customer.address || ""
      });
    }
  };

  const handleCreateRequest = () => {
    createRequest.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">קריאות שירות</h1>
          <p className="text-muted-foreground">נהל קריאות שירות מלקוחות</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-bottle-600 hover:bg-bottle-700"
        >
          <Plus className="h-4 w-4 ml-2" />
          קריאת שירות חדשה
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="חפש לפי כותרת, תיאור או לקוח..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] text-right">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent align="end" className="text-right">
              <SelectItem value="all" className="text-right">כל הסטטוסים</SelectItem>
              <SelectItem value="pending" className="text-right">ממתינות</SelectItem>
              <SelectItem value="in_progress" className="text-right">בטיפול</SelectItem>
              <SelectItem value="completed" className="text-right">הושלמו</SelectItem>
              <SelectItem value="cancelled" className="text-right">בוטלו</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px] text-right">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent align="end" className="text-right">
              <SelectItem value="all" className="text-right">כל העדיפויות</SelectItem>
              <SelectItem value="low" className="text-right">נמוכה</SelectItem>
              <SelectItem value="normal" className="text-right">רגילה</SelectItem>
              <SelectItem value="high" className="text-right">גבוהה</SelectItem>
              <SelectItem value="urgent" className="text-right">דחופה</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Service Requests Table */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">כותרת</TableHead>
                <TableHead className="text-right">לקוח</TableHead>
                <TableHead className="text-right">טלפון</TableHead>
                <TableHead className="text-right">תאריך מועדף</TableHead>
                <TableHead className="text-right">שעה מועדפת</TableHead>
                <TableHead className="text-right">עדיפות</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תמונה</TableHead>
                <TableHead className="w-[120px] text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium text-right">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-bottle-600 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{request.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{request.customers?.name || "-"}</TableCell>
                  <TableCell className="text-right" dir="ltr">
                    {request.customer_phone || request.customers?.phone || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.preferred_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: he })}</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.preferred_time_slot ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{request.preferred_time_slot}</span>
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {getPriorityBadge(request.priority)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(request.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    {request.image_url ? (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                        <span className="text-xs">כן</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4 ml-2" />
                      צפה
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">אין קריאות שירות</h3>
                    <p className="text-gray-500">לא נמצאו קריאות שירות המתאימות לסינון הנוכחי</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Request Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>פרטי קריאת שירות</DialogTitle>
            <DialogDescription>
              צפה וערוך את פרטי קריאת השירות
            </DialogDescription>
          </DialogHeader>
          
          {/* Quick Actions */}
          {selectedRequest && (
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              <Button
                onClick={handleMarkAsCompleted}
                disabled={updateRequest.isPending || selectedRequest.status === 'completed'}
                className="flex-1 sm:flex-initial bg-green-600 hover:bg-green-700 text-white"
                variant="default"
              >
                {updateRequest.isPending ? (
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 ml-2" />
                )}
                קריאה הסתיימה
              </Button>
              <Button
                onClick={handleClose}
                variant="outline"
                className="flex-1 sm:flex-initial"
              >
                <X className="h-4 w-4 ml-2" />
                סגירה וחזרה
              </Button>
            </div>
          )}
          
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">כותרת</Label>
                <Input
                  id="title"
                  value={selectedRequest.title}
                  onChange={(e) => setSelectedRequest({...selectedRequest, title: e.target.value})}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">תיאור</Label>
                <Textarea
                  id="description"
                  value={selectedRequest.description}
                  onChange={(e) => setSelectedRequest({...selectedRequest, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">סטטוס</Label>
                  <Select 
                    value={selectedRequest.status || "pending"}
                    onValueChange={(value) => setSelectedRequest({...selectedRequest, status: value as ServiceRequest['status']})}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      <SelectItem value="pending" className="text-right">ממתינה</SelectItem>
                      <SelectItem value="in_progress" className="text-right">בטיפול</SelectItem>
                      <SelectItem value="completed" className="text-right">הושלמה</SelectItem>
                      <SelectItem value="cancelled" className="text-right">בוטלה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select 
                    value={selectedRequest.priority || "normal"}
                    onValueChange={(value) => setSelectedRequest({...selectedRequest, priority: value as ServiceRequest['priority']})}
                  >
                    <SelectTrigger className="text-right">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      <SelectItem value="low" className="text-right">נמוכה</SelectItem>
                      <SelectItem value="normal" className="text-right">רגילה</SelectItem>
                      <SelectItem value="high" className="text-right">גבוהה</SelectItem>
                      <SelectItem value="urgent" className="text-right">דחופה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="technician_notes">הערות טכנאי</Label>
                <Textarea
                  id="technician_notes"
                  value={selectedRequest.technician_notes || ""}
                  onChange={(e) => setSelectedRequest({...selectedRequest, technician_notes: e.target.value})}
                  placeholder="הוסף הערות לטכנאי..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>לקוח</Label>
                  <p className="text-sm font-medium p-2 bg-muted rounded">{selectedRequest.customers?.name || "-"}</p>
                </div>
                <div className="grid gap-2">
                  <Label>טלפון</Label>
                  <p className="text-sm font-medium p-2 bg-muted rounded" dir="ltr">
                    {selectedRequest.customer_phone || selectedRequest.customers?.phone || "-"}
                  </p>
                </div>
              </div>

              {selectedRequest.preferred_date && (
                <div className="grid gap-2">
                  <Label>תאריך מועדף</Label>
                  <p className="text-sm font-medium p-2 bg-muted rounded">
                    {format(new Date(selectedRequest.preferred_date), "dd/MM/yyyy", { locale: he })}
                  </p>
                </div>
              )}

              {selectedRequest.preferred_time_slot && (
                <div className="grid gap-2">
                  <Label>שעה מועדפת</Label>
                  <p className="text-sm font-medium p-2 bg-muted rounded">{selectedRequest.preferred_time_slot}</p>
                </div>
              )}

              {selectedRequest.location && (
                <div className="grid gap-2">
                  <Label>מיקום</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{selectedRequest.location}</p>
                  </div>
                </div>
              )}

              {selectedRequest.image_url && (
                <div className="grid gap-2">
                  <Label>תמונה מצורפת</Label>
                  <a 
                    href={selectedRequest.image_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={selectedRequest.image_url} 
                      alt="תמונת בקשה" 
                      className="max-w-full rounded-lg shadow-md border hover:opacity-90 transition-opacity cursor-pointer"
                      onError={(e) => {
                        console.error('Failed to load image:', selectedRequest.image_url);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  </a>
                  <p className="text-xs text-muted-foreground">לחץ על התמונה לצפייה בגודל מלא</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
            <Button 
              onClick={handleSaveRequest}
              disabled={updateRequest.isPending}
              className="w-full bg-bottle-600 hover:bg-bottle-700"
            >
              {updateRequest.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Service Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) resetNewRequestForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>יצירת קריאת שירות חדשה</DialogTitle>
            <DialogDescription>
              צור קריאת שירות עבור לקוח
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Customer Selection */}
            <div className="grid gap-2">
              <Label htmlFor="customer">לקוח *</Label>
              {customersData && customersData.length > 0 ? (
                <Select value={newRequest.customer_id} onValueChange={handleCustomerSelect}>
                  <SelectTrigger id="customer" className="text-right">
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
                    {customersData.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id} className="text-right">
                        <div>
                          <span className="font-medium block">{customer.name}</span>
                          <span className="text-xs text-gray-500 block">
                            {customer.phone} {customer.city && `• ${customer.city}`}
                          </span>
                        </div>
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

            {/* Service Type */}
            <div className="grid gap-2">
              <Label htmlFor="service-type">סוג השירות *</Label>
              <Select
                value={newRequest.service_type}
                onValueChange={(value) => setNewRequest({ ...newRequest, service_type: value })}
              >
                <SelectTrigger id="service-type" className="text-right">
                  <SelectValue placeholder="בחר סוג שירות" />
                </SelectTrigger>
                <SelectContent align="end" className="text-right">
                  <SelectItem value="installation" className="text-right">התקנת מערכת גז</SelectItem>
                  <SelectItem value="repair" className="text-right">תיקון תקלה</SelectItem>
                  <SelectItem value="maintenance" className="text-right">בדיקה תקופתית</SelectItem>
                  <SelectItem value="emergency" className="text-right">חירום - דליפת גז</SelectItem>
                  <SelectItem value="consultation" className="text-right">ייעוץ</SelectItem>
                  <SelectItem value="other" className="text-right">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="new-description">תיאור הבעיה *</Label>
              <Textarea
                id="new-description"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="תאר את הבעיה או את השירות הנדרש"
                rows={3}
                className="text-right"
              />
            </div>

            {/* Priority and Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-priority">עדיפות</Label>
                <Select 
                  value={newRequest.priority}
                  onValueChange={(value) => setNewRequest({ ...newRequest, priority: value as ServiceRequest['priority'] })}
                >
                  <SelectTrigger id="new-priority" className="text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="text-right">
                    <SelectItem value="low" className="text-right">נמוכה</SelectItem>
                    <SelectItem value="normal" className="text-right">רגילה</SelectItem>
                    <SelectItem value="high" className="text-right">גבוהה</SelectItem>
                    <SelectItem value="urgent" className="text-right">דחופה</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-preferred-date">תאריך מועדף</Label>
                <Input
                  id="new-preferred-date"
                  type="date"
                  value={newRequest.preferred_date}
                  onChange={(e) => setNewRequest({ ...newRequest, preferred_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-right"
                />
              </div>
            </div>

            {/* Time Slot */}
            <div className="grid gap-2">
              <Label htmlFor="new-time-slot">שעה מועדפת</Label>
              <Select
                value={newRequest.preferred_time_slot}
                onValueChange={(value) => setNewRequest({ ...newRequest, preferred_time_slot: value })}
              >
                <SelectTrigger id="new-time-slot" className="text-right">
                  <SelectValue placeholder="בחר שעה" />
                </SelectTrigger>
                <SelectContent align="end" className="text-right">
                  <SelectItem value="morning" className="text-right">בוקר (8:00-12:00)</SelectItem>
                  <SelectItem value="afternoon" className="text-right">צהריים (12:00-16:00)</SelectItem>
                  <SelectItem value="evening" className="text-right">ערב (16:00-20:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City and Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-city">יישוב</Label>
                {cities.length > 0 ? (
                  <Select value={newRequest.city} onValueChange={(value) => setNewRequest({ ...newRequest, city: value })}>
                    <SelectTrigger id="new-city" className="text-right">
                      <SelectValue placeholder="בחר יישוב" />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      <div className="p-2">
                        <Input
                          placeholder="חפש יישוב..."
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
                      {cities.map(city => (
                        <SelectItem key={city} value={city} className="text-right">{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input disabled placeholder="טוען יישובים..." className="text-right" />
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-address">כתובת</Label>
                <Input
                  id="new-address"
                  value={newRequest.address}
                  onChange={(e) => setNewRequest({ ...newRequest, address: e.target.value })}
                  placeholder="רחוב ומספר בית"
                  className="text-right"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="new-phone">טלפון ליצירת קשר</Label>
              <Input
                id="new-phone"
                type="tel"
                value={newRequest.customer_phone}
                onChange={(e) => setNewRequest({ ...newRequest, customer_phone: e.target.value })}
                placeholder="050-1234567"
                className="text-right"
                dir="ltr"
              />
            </div>

            {/* Technician Notes */}
            <div className="grid gap-2">
              <Label htmlFor="new-tech-notes">הערות טכנאי</Label>
              <Textarea
                id="new-tech-notes"
                value={newRequest.technician_notes}
                onChange={(e) => setNewRequest({ ...newRequest, technician_notes: e.target.value })}
                placeholder="הערות נוספות..."
                rows={2}
                className="text-right"
              />
            </div>

            {/* Image Upload */}
            <div className="grid gap-2">
              <Label>תמונה מצורפת (אופציונלי)</Label>
              <div className="flex flex-col items-center space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-32 w-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex flex-col items-center space-y-2 w-full">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="new-image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('new-image-upload')?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 ml-2" />
                    {imagePreview ? "החלף תמונה" : "בחר תמונה"}
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    מקסימום 5MB. פורמטים נתמכים: JPG, PNG, GIF, WEBP
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetNewRequestForm();
              }}
              className="w-full sm:w-auto"
            >
              ביטול
            </Button>
            <Button 
              onClick={handleCreateRequest}
              disabled={createRequest.isPending || !newRequest.customer_id || !newRequest.description}
              className="w-full sm:w-auto bg-bottle-600 hover:bg-bottle-700"
            >
              {createRequest.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              צור קריאת שירות
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
