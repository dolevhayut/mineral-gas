import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Calendar, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getAllDeliveryDays,
  saveDeliveryDay,
  getHebrewDayName,
} from "@/lib/deliveryDays";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DeliveryDayConfig {
  dayOfWeek: number;
  cities: string[];
}

export default function DeliveryDays() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [deliveryDaysConfig, setDeliveryDaysConfig] = useState<DeliveryDayConfig[]>([]);
  const [searchTerms, setSearchTerms] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch cities from Israeli Government Open Data API
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

          const cities: string[] = [...new Set(northernCities)].sort();
          setAvailableCities(cities);
        } else {
          console.error("Error fetching cities from government API");
          toast.error("שגיאה בטעינת רשימת יישובים");
        }

        // Fetch existing delivery days configuration
        const deliveryDays = await getAllDeliveryDays();
        
        // Initialize config for work days only (Sunday to Friday)
        const config: DeliveryDayConfig[] = [];
        for (let day = 0; day <= 5; day++) { // 0=Sunday to 5=Friday only
          const existingConfig = deliveryDays.find(d => d.day_of_week === day);
          config.push({
            dayOfWeek: day,
            cities: existingConfig?.cities || [],
          });
        }
        setDeliveryDaysConfig(config);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("שגיאה בטעינת הנתונים");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCityToggle = (dayOfWeek: number, city: string, isChecked: boolean) => {
    setDeliveryDaysConfig(prev => {
      return prev.map(config => {
        if (config.dayOfWeek === dayOfWeek) {
          const cities = isChecked
            ? [...config.cities, city]
            : config.cities.filter(c => c !== city);
          return { ...config, cities };
        }
        return config;
      });
    });
  };

  const handleSearchChange = (dayOfWeek: number, searchTerm: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [dayOfWeek]: searchTerm
    }));
  };

  const getFilteredCities = (dayOfWeek: number) => {
    const searchTerm = searchTerms[dayOfWeek] || '';
    if (!searchTerm.trim()) {
      return availableCities;
    }
    return availableCities.filter(city =>
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const config of deliveryDaysConfig) {
        const success = await saveDeliveryDay(config.dayOfWeek, config.cities);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success("הגדרות ימי האספקה נשמרו בהצלחה");
      } else {
        toast.error(`נשמרו ${successCount} ימים, ${errorCount} נכשלו`);
      }
    } catch (error) {
      console.error("Error saving delivery days:", error);
      toast.error("שגיאה בשמירת ההגדרות");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ניהול ימי אספקה</h1>
          <p className="text-muted-foreground">
            הגדר אילו יישובים יקבלו אספקה בכל יום (ראשון-שישי, 08:00-16:00)
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Save className="ml-2 h-4 w-4" />
              שמור הגדרות
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>הוראות שימוש:</strong> גלול אופקית כדי לראות את ימי העבודה (ראשון-שישי). בחר עבור כל יום אילו יישובים יקבלו אספקה.
            היישובים נטענים מ-API ממשלתי (יישובי הצפון בלבד).
          </AlertDescription>
        </Alert>
        
        <Alert className="bg-green-50 border-green-200">
          <Calendar className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <strong>שעות פעילות:</strong> אספקות מתבצעות בימים ראשון עד שישי בלבד, בין השעות 08:00-16:00.
            הלקוחות יראו רק את הימים שבהם היישוב שלהם זמין לאספקה.
          </AlertDescription>
        </Alert>
      </div>

      {availableCities.length === 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            לא נמצאו יישובים. בדוק את החיבור ל-API של data.gov.il או רענן את הדף.
          </AlertDescription>
        </Alert>
      )}

      {/* Kanban Board Style Layout - Sunday to Friday Only */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '600px' }}>
        {deliveryDaysConfig.map((config) => {
          const hebrewDayName = getHebrewDayName(config.dayOfWeek);
          const selectedCount = config.cities.length;
          
          // Color schemes for different days
          const dayColors = [
            'from-red-50 to-red-100 border-red-200',      // Sunday
            'from-orange-50 to-orange-100 border-orange-200', // Monday
            'from-yellow-50 to-yellow-100 border-yellow-200', // Tuesday
            'from-green-50 to-green-100 border-green-200',    // Wednesday
            'from-blue-50 to-blue-100 border-blue-200',       // Thursday
            'from-purple-50 to-purple-100 border-purple-200', // Friday
            'from-gray-50 to-gray-100 border-gray-200',       // Saturday
          ];
          
          const iconColors = [
            'text-red-600',    // Sunday
            'text-orange-600', // Monday
            'text-yellow-600', // Tuesday
            'text-green-600',  // Wednesday
            'text-blue-600',   // Thursday
            'text-purple-600', // Friday
            'text-gray-600',   // Saturday
          ];

          return (
            <Card 
              key={config.dayOfWeek} 
              className="flex-shrink-0 w-80 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardHeader className={`bg-gradient-to-r ${dayColors[config.dayOfWeek]} border-b-2 sticky top-0 z-10`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-5 w-5 ${iconColors[config.dayOfWeek]}`} />
                    <CardTitle className="text-lg font-bold">{hebrewDayName}</CardTitle>
                  </div>
                  <Badge 
                    variant={selectedCount > 0 ? "default" : "secondary"}
                    className="font-semibold"
                  >
                    {selectedCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pt-4 pb-4 flex flex-col">
                {availableCities.length > 0 ? (
                  <div className="flex flex-col h-full space-y-3">
                    {/* Search Input */}
                    <div className="relative flex-shrink-0">
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="חפש יישוב..."
                        value={searchTerms[config.dayOfWeek] || ''}
                        onChange={(e) => handleSearchChange(config.dayOfWeek, e.target.value)}
                        className="pr-10 text-right h-9"
                      />
                    </div>

                    {/* Cities Count */}
                    {getFilteredCities(config.dayOfWeek).length > 0 && (
                      <p className="text-xs text-gray-500 text-center flex-shrink-0">
                        {getFilteredCities(config.dayOfWeek).length} יישובים
                      </p>
                    )}

                    {/* Cities List - Scrollable */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{ maxHeight: '450px' }}>
                      {getFilteredCities(config.dayOfWeek).map((city) => {
                        const isChecked = config.cities.includes(city);
                        return (
                          <div 
                            key={city} 
                            className={`flex items-center space-x-2 space-x-reverse p-2 rounded-md hover:bg-gray-50 transition-colors ${
                              isChecked ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                            }`}
                          >
                            <Checkbox
                              id={`${config.dayOfWeek}-${city}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCityToggle(config.dayOfWeek, city, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`${config.dayOfWeek}-${city}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {city}
                            </Label>
                          </div>
                        );
                      })}
                      {getFilteredCities(config.dayOfWeek).length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">לא נמצאו יישובים תואמים</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500 text-center">
                      טוען יישובים מ-data.gov.il...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <Save className="ml-2 h-4 w-4" />
              שמור הגדרות
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

