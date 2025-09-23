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

// Sort products by VAWO code utility function
export const sortProductsByVawoCode = <T extends { vawo_code?: string; name: string }>(products: T[]): T[] => {
  return [...products].sort((a, b) => {
    const aVawoCode = a.vawo_code || '';
    const bVawoCode = b.vawo_code || '';
    
    // If both have vawo_code, sort numerically
    if (aVawoCode && bVawoCode) {
      return parseInt(aVawoCode) - parseInt(bVawoCode);
    }
    
    // If only one has vawo_code, prioritize it
    if (aVawoCode && !bVawoCode) return -1;
    if (!aVawoCode && bVawoCode) return 1;
    
    // If neither has vawo_code, sort by name
    return a.name.localeCompare(b.name, 'he');
  });
};
