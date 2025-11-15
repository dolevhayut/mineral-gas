import { useState } from "react";
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
  Eye
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">קריאות שירות</h1>
          <p className="text-muted-foreground">נהל קריאות שירות מלקוחות</p>
        </div>
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              <SelectItem value="pending">ממתינות</SelectItem>
              <SelectItem value="in_progress">בטיפול</SelectItem>
              <SelectItem value="completed">הושלמו</SelectItem>
              <SelectItem value="cancelled">בוטלו</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <FilterIcon className="h-4 w-4 ml-2" />
              <SelectValue placeholder="עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              <SelectItem value="low">נמוכה</SelectItem>
              <SelectItem value="normal">רגילה</SelectItem>
              <SelectItem value="high">גבוהה</SelectItem>
              <SelectItem value="urgent">דחופה</SelectItem>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">ממתינה</SelectItem>
                      <SelectItem value="in_progress">בטיפול</SelectItem>
                      <SelectItem value="completed">הושלמה</SelectItem>
                      <SelectItem value="cancelled">בוטלה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">עדיפות</Label>
                  <Select 
                    value={selectedRequest.priority || "normal"}
                    onValueChange={(value) => setSelectedRequest({...selectedRequest, priority: value as ServiceRequest['priority']})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">נמוכה</SelectItem>
                      <SelectItem value="normal">רגילה</SelectItem>
                      <SelectItem value="high">גבוהה</SelectItem>
                      <SelectItem value="urgent">דחופה</SelectItem>
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
                  <img 
                    src={selectedRequest.image_url} 
                    alt="תמונת בקשה" 
                    className="max-w-full rounded-lg shadow-md border"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              ביטול
            </Button>
            <Button 
              onClick={handleSaveRequest}
              disabled={updateRequest.isPending}
              className="w-full sm:w-auto order-1 sm:order-2 bg-bottle-600 hover:bg-bottle-700"
            >
              {updateRequest.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              שמור שינויים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
