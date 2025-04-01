import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SystemUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_active: boolean;
  expiry_date?: string | null;
}

export function SystemUpdatesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState<Partial<SystemUpdate> | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  
  // Fetch system updates
  const { data: systemUpdates, isLoading: isLoadingUpdates } = useQuery({
    queryKey: ["system-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_updates")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching system updates:", error);
        toast({
          title: "שגיאה בטעינת עדכונים",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      
      return data || [];
    }
  });
  
  // Reset form state
  const resetForm = () => {
    setCurrentUpdate(null);
    setTitle("");
    setContent("");
    setIsActive(true);
    setExpiryDate(undefined);
  };
  
  // Open dialog for new update
  const handleNewUpdate = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an update
  const handleEditUpdate = (update: SystemUpdate) => {
    setCurrentUpdate(update);
    setTitle(update.title);
    setContent(update.content);
    setIsActive(update.is_active);
    setExpiryDate(update.expiry_date ? new Date(update.expiry_date) : undefined);
    setIsDialogOpen(true);
  };
  
  // Create or update system update
  const saveUpdate = useMutation({
    mutationFn: async () => {
      setIsLoading(true);
      
      try {
        const updateData = {
          title,
          content,
          is_active: isActive,
          expiry_date: expiryDate ? expiryDate.toISOString().split("T")[0] : null,
        };
        
        if (currentUpdate?.id) {
          // Update existing record
          const { error } = await supabase
            .from("system_updates")
            .update({
              ...updateData,
              updated_at: new Date().toISOString()
            })
            .eq("id", currentUpdate.id);
            
          if (error) throw error;
          
          toast({
            title: "עדכון נשמר",
            description: "עדכון המערכת נשמר בהצלחה",
          });
        } else {
          // Create new record
          const { error } = await supabase
            .from("system_updates")
            .insert(updateData);
            
          if (error) throw error;
          
          toast({
            title: "עדכון נוצר",
            description: "עדכון המערכת נוצר בהצלחה",
          });
        }
        
        // Close dialog and reset form
        setIsDialogOpen(false);
        resetForm();
        
        // Invalidate query to refresh data
        queryClient.invalidateQueries({ queryKey: ["system-updates"] });
      } catch (error: unknown) {
        console.error("Error saving system update:", error);
        const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
        toast({
          title: "שגיאה בשמירת עדכון",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  });
  
  // Delete system update
  const deleteUpdate = useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from("system_updates")
          .delete()
          .eq("id", id);
          
        if (error) throw error;
        
        toast({
          title: "עדכון נמחק",
          description: "עדכון המערכת נמחק בהצלחה",
        });
        
        // Invalidate query to refresh data
        queryClient.invalidateQueries({ queryKey: ["system-updates"] });
      } catch (error: unknown) {
        console.error("Error deleting system update:", error);
        const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
        toast({
          title: "שגיאה במחיקת עדכון",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  });
  
  // Format date helper
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "אין תאריך";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: he });
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>עדכוני מערכת</CardTitle>
          <Button onClick={handleNewUpdate}>
            <Plus className="h-4 w-4 mr-2" />
            עדכון חדש
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingUpdates ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : systemUpdates?.length ? (
            <div className="space-y-4">
              {systemUpdates.map((update: SystemUpdate) => (
                <div key={update.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-lg">{update.title}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <span className="mr-4">נוצר: {formatDate(update.created_at)}</span>
                        {update.expiry_date && (
                          <span>תפוגה: {formatDate(update.expiry_date)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditUpdate(update)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-destructive hover:text-destructive" 
                        onClick={() => deleteUpdate.mutate(update.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <p className="text-sm whitespace-pre-wrap">{update.content}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                      update.is_active 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {update.is_active ? "פעיל" : "לא פעיל"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              אין עדכוני מערכת. לחץ על "עדכון חדש" כדי ליצור את העדכון הראשון.
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog for creating/editing system updates */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {currentUpdate?.id ? "עריכת עדכון מערכת" : "עדכון מערכת חדש"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="הכנס כותרת לעדכון"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">תוכן העדכון</Label>
              <Textarea 
                id="content" 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="הכנס את תוכן העדכון"
                rows={5}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="is-active">פעיל</Label>
              <div className="ltr-switch">
                <Switch 
                  id="is-active" 
                  checked={isActive} 
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>תאריך תפוגה (אופציונלי)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-right"
                  >
                    <Calendar className="ml-2 h-4 w-4" />
                    {expiryDate ? (
                      format(expiryDate, "dd/MM/yyyy", { locale: he })
                    ) : (
                      <span>בחר תאריך</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {expiryDate && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => setExpiryDate(undefined)}
                >
                  נקה תאריך
                </Button>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <DialogClose asChild>
              <Button variant="outline">ביטול</Button>
            </DialogClose>
            <Button 
              onClick={() => saveUpdate.mutate()}
              disabled={!title || !content || isLoading}
            >
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {currentUpdate?.id ? "עדכן" : "צור"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 