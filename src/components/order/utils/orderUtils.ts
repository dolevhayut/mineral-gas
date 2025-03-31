
// Helper function to convert day ID to Hebrew day name
export function getHebrewDayName(dayId: string): string {
  const dayMap: Record<string, string> = {
    sunday: "ראשון",
    monday: "שני",
    tuesday: "שלישי",
    wednesday: "רביעי",
    thursday: "חמישי",
    friday: "שישי",
    saturday: "שבת",
  };
  return dayMap[dayId] || dayId;
}
