import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  BuildingIcon,
  ShieldIcon,
} from "lucide-react";
import MainLayoutWithFooter from "@/components/MainLayoutWithFooter";
import { supabase } from "@/integrations/supabase/client";

const EditProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);

  const [profileData, setProfileData] = useState({
    name: "",
    address: "",
    delivery_instructions: "",
    city: ""
  });

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

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load directly from Supabase
      const { data: customer, error } = await supabase 
        .from('customers')
        .select('name, address, delivery_instructions, city')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (customer) {
        setProfileData({
          name: customer.name || "",
          address: customer.address || "",
          delivery_instructions: customer.delivery_instructions || "",
          city: customer.city || ""
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setErrorMessage("שגיאה בטעינת נתוני הפרופיל");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load profile data on component mount
  useEffect(() => {
    if (user?.id) {
      loadProfileData();
    }
  }, [user?.id, loadProfileData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setErrorMessage("נדרש להתחבר למערכת");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Update directly in Supabase
      const { error } = await supabase
        .from('customers')
        .update({
          name: profileData.name,
          address: profileData.address,
          delivery_instructions: profileData.delivery_instructions,
          city: profileData.city
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMessage("הפרופיל עודכן בהצלחה");
      toast({
        title: "הפרופיל עודכן",
        description: "השינויים נשמרו בהצלחה",
      });

    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(error instanceof Error ? error.message : "אירעה שגיאה בעדכון הפרופיל");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">טוען נתוני פרופיל...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayoutWithFooter>
      <div className="min-h-screen bg-gray-50 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <UserIcon className="h-6 w-6" />
              עריכת פרופיל
            </CardTitle>
            <CardDescription className="text-gray-600">
              עדכן את הפרטים החשובים
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>שגיאה</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertTitle className="text-green-800">הצלחה</AlertTitle>
                <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  פרטים אישיים
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-medium">
                      שם מלא *
                    </Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="הזן את שמך המלא"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-medium flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      מספר טלפון
                    </Label>
                    <Input
                      id="phone"
                      value={user?.phone || ""}
                      disabled
                      className="h-10 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500">מספר הטלפון לא ניתן לשינוי</p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  פרטי כתובת
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="city" className="font-medium">
                    יישוב *
                  </Label>
                  {cities.length > 0 ? (
                    <Select value={profileData.city} onValueChange={(value) => handleInputChange('city', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="בחר יישוב" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="p-2">
                          <Input
                            placeholder="חפש יישוב..."
                            className="h-8 mb-2"
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
                  <Label htmlFor="address" className="font-medium">
                    כתובת
                  </Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="רחוב ומספר בית"
                    className="h-10"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  הוראות משלוח
                </h3>
                <div className="space-y-2">
                  <Textarea
                    id="delivery_instructions"
                    value={profileData.delivery_instructions}
                    onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                    placeholder="הוראות מיוחדות למשלוח (קומה, דלת, וכו')"
                    className="min-h-[80px]"
                  />
                </div>
              </div>


              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? "שומר..." : "שמור שינויים"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadProfileData}
                  className="h-10 px-6"
                >
                  בטל
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    </MainLayoutWithFooter>
  );
};

export default EditProfile;
