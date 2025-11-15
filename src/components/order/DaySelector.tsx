import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getAvailableDaysForCity,
  getHebrewDayName,
  getNextWeekdayDate,
  formatDateWithHebrewDay,
} from "@/lib/deliveryDays";
import { toast } from "sonner";

interface DaySelectorProps {
  selectedDay?: number; // Day of week (0-6)
  onDaySelect: (dayOfWeek: number, date: Date) => void;
  adminSelectedCustomer?: {id: string, name: string, phone: string, city?: string} | null;
}

export default function DaySelector({ selectedDay, onDaySelect, adminSelectedCustomer }: DaySelectorProps) {
  const { user } = useAuth();
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserCityAndAvailableDays = async () => {
      // Determine customer ID: admin selected customer or authenticated user
      const customerId = adminSelectedCustomer?.id || user?.id;
      
      if (!customerId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch customer's city from customer profile
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('city')
          .eq('id', customerId)
          .single();

        if (customerError) {
          console.error("Error fetching customer city:", customerError);
          // Try to use city from adminSelectedCustomer if available
          const city = adminSelectedCustomer?.city;
          if (city) {
            setUserCity(city);
            const days = await getAvailableDaysForCity(city);
            setAvailableDays(days);
            setIsLoading(false);
            return;
          }
          toast.error("שגיאה בטעינת פרטי המשתמש");
          setIsLoading(false);
          return;
        }

        const city = customerData?.city || adminSelectedCustomer?.city;
        setUserCity(city);

        if (!city) {
          toast.error("לא הוגדר עיר בפרופיל. אנא עדכן את הפרופיל");
          setIsLoading(false);
          return;
        }

        // Fetch available delivery days for the customer's city
        const days = await getAvailableDaysForCity(city);
        
        if (days.length === 0) {
          toast.error(`לא מוגדרים ימי משלוח לעיר ${city}. אנא צור קשר עם התמיכה`);
        }

        setAvailableDays(days);
      } catch (error) {
        console.error("Unexpected error fetching delivery days:", error);
        toast.error("שגיאה בטעינת ימי משלוח זמינים");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCityAndAvailableDays();
  }, [user, adminSelectedCustomer]);

  const handleDayClick = (dayOfWeek: number) => {
    const calculatedDate = getNextWeekdayDate(dayOfWeek);
    onDaySelect(dayOfWeek, calculatedDate);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="mr-2">טוען ימי משלוח...</span>
      </div>
    );
  }

  if (!userCity) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-center text-sm text-yellow-800">
          לא הוגדר עיר בפרופיל שלך. אנא עדכן את הפרופיל בהגדרות.
        </p>
      </Card>
    );
  }

  if (availableDays.length === 0) {
    return (
      <Card className="p-4 bg-yellow-50 border-yellow-200">
        <p className="text-center text-sm text-yellow-800">
          אין ימי משלוח זמינים לעיר {userCity}. אנא צור קשר עם התמיכה.
        </p>
      </Card>
    );
  }

  const getSelectedDateDisplay = () => {
    if (selectedDay === undefined) return null;
    const date = getNextWeekdayDate(selectedDay);
    return formatDateWithHebrewDay(date);
  };

  const getDeliveryDaysText = () => {
    if (availableDays.length === 0) return "";
    const dayNames = availableDays.map(day => getHebrewDayName(day));
    if (dayNames.length === 1) return dayNames[0];
    if (dayNames.length === 2) return `${dayNames[0]} ו${dayNames[1]}`;
    const lastDay = dayNames.pop();
    return `${dayNames.join(", ")} ו${lastDay}`;
  };

  return (
    <div className="w-full space-y-3">
      <div className="text-sm text-gray-600 text-right space-y-1">
        <p className="font-medium">בחר יום משלוח מהימים הזמינים לעיר {userCity}:</p>
        <p className="text-xs text-gray-500">
          ⏰ אספקות מתבצעות בימים {getDeliveryDaysText()} בין השעות 08:00-16:00
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {availableDays.map((dayOfWeek) => {
          const isSelected = selectedDay === dayOfWeek;
          const dayName = getHebrewDayName(dayOfWeek);
          const nextDate = getNextWeekdayDate(dayOfWeek);
          const dateString = nextDate.toLocaleDateString("he-IL");

          return (
            <Button
              key={dayOfWeek}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "h-auto py-3 px-2 flex flex-col items-center justify-center text-center transition-all",
                isSelected && "bg-green-600 hover:bg-green-700 border-green-700"
              )}
              onClick={() => handleDayClick(dayOfWeek)}
            >
              <span className="font-semibold text-base">{dayName}</span>
              <span className="text-xs mt-1 opacity-80">{dateString}</span>
            </Button>
          );
        })}
      </div>

      {selectedDay !== undefined && (
        <Card className="p-3 bg-green-50 border-green-200">
          <div className="flex items-center justify-center gap-2">
            <CalendarIcon className="h-4 w-4 text-green-700" />
            <p className="text-sm font-medium text-green-800 text-center">
              תאריך משלוח: {getSelectedDateDisplay()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

