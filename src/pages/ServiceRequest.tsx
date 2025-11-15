import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { useAuth } from "@/context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Send, Upload, X, Image as ImageIcon } from "lucide-react";

const ServiceRequest = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    serviceType: "",
    description: "",
    preferredDate: "",
    preferredTimeSlot: "",
    city: "",
    address: "",
    customerPhone: user?.phone || ""
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.serviceType || !formData.description) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get customer ID
      const { data: customerData } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', user?.phone)
        .single();

      if (!customerData) {
        throw new Error("לא נמצא משתמש");
      }

      let imageUrl = null;

      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${customerData.id}_${Date.now()}.${fileExt}`;
        const filePath = `service-requests/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(filePath, selectedImage);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          // Continue without image if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('service-images')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('service_requests')
        .insert({
          customer_id: customerData.id,
          title: `${formData.serviceType} - ${formData.city || 'לא צוין יישוב'}`,
          description: formData.description,
          service_type: formData.serviceType,
          preferred_date: formData.preferredDate || null,
          preferred_time_slot: formData.preferredTimeSlot || null,
          city: formData.city || null,
          address: formData.address || null,
          customer_phone: formData.customerPhone,
          image_url: imageUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "הבקשה נשלחה בהצלחה",
        description: "נציג שירות יצור איתך קשר בהקדם"
      });

      navigate("/");
    } catch (error) {
      console.error("Error submitting service request:", error);
      toast({
        title: "שגיאה בשליחת הבקשה",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayoutWithFooter>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="text-center mb-4">
              <CardTitle className="text-2xl">פתיחת קריאת שירות</CardTitle>
            </div>
            <CardDescription className="text-center">
              מלא את הטופס ונציג שירות יצור איתך קשר בהקדם
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="serviceType" className="text-right">סוג השירות *</Label>
                <Select
                  value={formData.serviceType}
                  onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                >
                  <SelectTrigger id="serviceType" className="text-right">
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

              <div className="space-y-2">
                <Label htmlFor="description" className="text-right">תיאור הבעיה *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="תאר את הבעיה או את השירות הנדרש"
                  rows={4}
                  className="text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preferredDate" className="text-right">תאריך מועדף</Label>
                  <Input
                    id="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredTimeSlot" className="text-right">שעה מועדפת</Label>
                  <Select
                    value={formData.preferredTimeSlot}
                    onValueChange={(value) => setFormData({ ...formData, preferredTimeSlot: value })}
                  >
                    <SelectTrigger id="preferredTimeSlot" className="text-right">
                      <SelectValue placeholder="בחר שעה" />
                    </SelectTrigger>
                    <SelectContent align="end" className="text-right">
                      <SelectItem value="morning" className="text-right">בוקר (8:00-12:00)</SelectItem>
                      <SelectItem value="afternoon" className="text-right">צהריים (12:00-16:00)</SelectItem>
                      <SelectItem value="evening" className="text-right">ערב (16:00-20:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-right">יישוב *</Label>
                {cities.length > 0 ? (
                  <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                    <SelectTrigger className="text-right">
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
                  <Input disabled placeholder="טוען יישובים..." />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-right">כתובת</Label>
                <Input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="רחוב ומספר בית"
                  className="text-right"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerPhone" className="text-right">טלפון ליצירת קשר</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="050-1234567"
                  className="text-right"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-right">תמונה מצורפת (אופציונלי)</Label>
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
                  
                  <div className="flex flex-col items-center space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      {imagePreview ? "החלף תמונה" : "בחר תמונה"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      מקסימום 5MB. פורמטים נתמכים: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
              </div>

              {formData.serviceType === "emergency" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium text-right">
                    במקרה חירום של דליפת גז:
                  </p>
                  <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1 text-right">
                    <li>סגור מיד את ברז הגז הראשי</li>
                    <li>פתח חלונות ודלתות לאוורור</li>
                    <li>אל תדליק או תכבה מכשירי חשמל</li>
                    <li>צא מהמבנה והתקשר לשירות החירום</li>
                  </ul>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-bottle-600 hover:bg-bottle-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  "שולח..."
                ) : (
                  <>
                    <Send className="ml-2 h-4 w-4" />
                    שלח קריאה
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayoutWithFooter>
  );
};

export default ServiceRequest;