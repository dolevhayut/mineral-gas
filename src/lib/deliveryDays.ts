import { supabase } from "@/integrations/supabase/client";

/**
 * Hebrew day names for display
 */
export const hebrewDayNames: Record<number, string> = {
  0: "יום ראשון",
  1: "יום שני",
  2: "יום שלישי",
  3: "יום רביעי",
  4: "יום חמישי",
  5: "יום שישי",
  6: "שבת",
};

/**
 * Short Hebrew day names for compact display
 */
export const shortHebrewDayNames: Record<number, string> = {
  0: "ראשון",
  1: "שני",
  2: "שלישי",
  3: "רביעי",
  4: "חמישי",
  5: "שישי",
  6: "שבת",
};

/**
 * Get Hebrew day name from day of week number
 * @param dayOfWeek - Day of week (0-6, Sunday=0)
 * @returns Hebrew name of the day
 */
export const getHebrewDayName = (dayOfWeek: number): string => {
  return hebrewDayNames[dayOfWeek] || "";
};

/**
 * Get short Hebrew day name from day of week number
 * @param dayOfWeek - Day of week (0-6, Sunday=0)
 * @returns Short Hebrew name of the day
 */
export const getShortHebrewDayName = (dayOfWeek: number): string => {
  return shortHebrewDayNames[dayOfWeek] || "";
};

/**
 * Calculate the next occurrence of a given weekday (always from tomorrow)
 * If today is Sunday and dayOfWeek is 0 (Sunday), it returns next Sunday
 * @param dayOfWeek - Day of week (0-6, Sunday=0)
 * @returns Date object of the next occurrence
 */
export const getNextWeekdayDate = (dayOfWeek: number): Date => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  const currentDay = tomorrow.getDay();
  let daysUntilTarget = dayOfWeek - currentDay;
  
  // If the target day is today or before, add 7 days to get next week
  if (daysUntilTarget < 0) {
    daysUntilTarget += 7;
  }
  
  const targetDate = new Date(tomorrow);
  targetDate.setDate(tomorrow.getDate() + daysUntilTarget);
  
  return targetDate;
};

/**
 * Format a date to display with Hebrew day name
 * @param date - Date to format
 * @returns Formatted string like "יום שני, 15/11/2024"
 */
export const formatDateWithHebrewDay = (date: Date): string => {
  const dayOfWeek = date.getDay();
  const hebrewDay = getHebrewDayName(dayOfWeek);
  const dateString = date.toLocaleDateString("he-IL");
  return `${hebrewDay}, ${dateString}`;
};

/**
 * Query available delivery days for a given city
 * @param city - City name to check
 * @returns Array of day of week numbers (0-6) when the city is serviced
 */
export const getAvailableDaysForCity = async (city: string | null | undefined): Promise<number[]> => {
  if (!city) {
    console.warn("No city provided to getAvailableDaysForCity");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('delivery_days')
      .select('day_of_week, cities')
      .contains('cities', [city]);

    if (error) {
      console.error("Error fetching delivery days:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn(`No delivery days configured for city: ${city}`);
      return [];
    }

    // Extract day_of_week values and filter out today's day
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    
    const availableDays = data
      .map(row => row.day_of_week)
      .filter(day => day !== todayDayOfWeek) // Cannot select today
      .sort((a, b) => a - b);

    return availableDays;
  } catch (error) {
    console.error("Unexpected error in getAvailableDaysForCity:", error);
    return [];
  }
};

/**
 * Get all configured delivery days (for admin)
 * @returns Array of delivery day configurations
 */
export const getAllDeliveryDays = async () => {
  try {
    const { data, error } = await supabase
      .from('delivery_days')
      .select('*')
      .order('day_of_week');

    if (error) {
      console.error("Error fetching all delivery days:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Unexpected error in getAllDeliveryDays:", error);
    return [];
  }
};

/**
 * Save or update delivery day configuration (admin function)
 * @param dayOfWeek - Day of week (0-6)
 * @param cities - Array of city names
 * @returns Success status
 */
export const saveDeliveryDay = async (dayOfWeek: number, cities: string[]): Promise<boolean> => {
  try {
    // Try to update first
    const { data: existing } = await supabase
      .from('delivery_days')
      .select('id')
      .eq('day_of_week', dayOfWeek)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('delivery_days')
        .update({ cities, updated_at: new Date().toISOString() })
        .eq('day_of_week', dayOfWeek);

      if (error) {
        console.error("Error updating delivery day:", error);
        return false;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('delivery_days')
        .insert({ day_of_week: dayOfWeek, cities });

      if (error) {
        console.error("Error inserting delivery day:", error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in saveDeliveryDay:", error);
    return false;
  }
};

/**
 * Delete delivery day configuration (admin function)
 * @param dayOfWeek - Day of week to delete (0-6)
 * @returns Success status
 */
export const deleteDeliveryDay = async (dayOfWeek: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('delivery_days')
      .delete()
      .eq('day_of_week', dayOfWeek);

    if (error) {
      console.error("Error deleting delivery day:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Unexpected error in deleteDeliveryDay:", error);
    return false;
  }
};

