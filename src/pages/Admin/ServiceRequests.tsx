import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { 
  Wrench, 
  Calendar, 
  Phone, 
  MapPin, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Image as ImageIcon,
  Edit,
  Save
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
  const [editMode, setEditMode] = useState(false);
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
    mutationFn: async (updatedRequest: Partial<ServiceRequest>) => {
      const { error } = await supabase
        .from("service_requests")
        .update({
          ...updatedRequest,
          updated_at: new Date().toISOString(),
          ...(updatedRequest.status === 'completed' && {
            completed_at: new Date().toISOString()
          })
        })
        .eq("id", selectedRequest?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      toast({ title: "בקשת השירות עודכנה בהצלחה" });
      setEditMode(false);
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
      <Badge className={`${badge.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
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
      <Badge className={badge.color}>
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">קריאות שירות</h1>
        <div className="flex gap-4">
          <Input
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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
            <SelectTrigger className="w-40">
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

      <div className="grid gap-4">
        {filteredRequests?.map((request) => (
          <Card 
            key={request.id} 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRequest(request)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-bottle-600" />
                    {request.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {request.customers?.name} • {request.customer_phone || request.customers?.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(request.priority)}
                  {getStatusBadge(request.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">{request.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {request.preferred_date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(request.preferred_date), "dd/MM/yyyy", { locale: he })}
                  </div>
                )}
                {request.preferred_time_slot && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {request.preferred_time_slot}
                  </div>
                )}
                {request.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {request.location}
                  </div>
                )}
                {request.image_url && (
                  <div className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    תמונה מצורפת
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => {
        setSelectedRequest(null);
        setEditMode(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>פרטי קריאת שירות</span>
              <Button
                onClick={() => setEditMode(!editMode)}
                variant="outline"
                size="sm"
              >
                {editMode ? <Save className="h-4 w-4 ml-1" /> : <Edit className="h-4 w-4 ml-1" />}
                {editMode ? "שמור" : "ערוך"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="font-medium">כותרת:</label>
                {editMode ? (
                  <Input
                    value={selectedRequest.title}
                    onChange={(e) => setSelectedRequest({...selectedRequest, title: e.target.value})}
                  />
                ) : (
                  <p>{selectedRequest.title}</p>
                )}
              </div>

              <div>
                <label className="font-medium">תיאור:</label>
                {editMode ? (
                  <Textarea
                    value={selectedRequest.description}
                    onChange={(e) => setSelectedRequest({...selectedRequest, description: e.target.value})}
                    rows={3}
                  />
                ) : (
                  <p>{selectedRequest.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">סטטוס:</label>
                  {editMode ? (
                    <Select 
                      value={selectedRequest.status}
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
                  ) : (
                    <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                  )}
                </div>

                <div>
                  <label className="font-medium">עדיפות:</label>
                  {editMode ? (
                    <Select 
                      value={selectedRequest.priority}
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
                  ) : (
                    <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="font-medium">הערות טכנאי:</label>
                {editMode ? (
                  <Textarea
                    value={selectedRequest.technician_notes || ""}
                    onChange={(e) => setSelectedRequest({...selectedRequest, technician_notes: e.target.value})}
                    placeholder="הוסף הערות לטכנאי..."
                    rows={3}
                  />
                ) : (
                  <p>{selectedRequest.technician_notes || "אין הערות"}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium">לקוח:</label>
                  <p>{selectedRequest.customers?.name}</p>
                </div>
                <div>
                  <label className="font-medium">טלפון:</label>
                  <p>{selectedRequest.customer_phone || selectedRequest.customers?.phone}</p>
                </div>
              </div>

              {selectedRequest.image_url && (
                <div>
                  <label className="font-medium">תמונה מצורפת:</label>
                  <img 
                    src={selectedRequest.image_url} 
                    alt="תמונת בקשה" 
                    className="mt-2 max-w-full rounded-lg shadow-md"
                  />
                </div>
              )}

              {editMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    ביטול
                  </Button>
                  <Button
                    onClick={() => updateRequest.mutate(selectedRequest)}
                    className="bg-bottle-600 hover:bg-bottle-700"
                  >
                    שמור שינויים
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
