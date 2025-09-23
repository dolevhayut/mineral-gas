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

// Sort products by name
export const sortProductsByName = <T extends { name: string }>(products: T[]): T[] => {
  return [...products].sort((a, b) => {
    return a.name.localeCompare(b.name, 'he');
  });
};
