// New type definition for order products that includes sku field
export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  uom?: string;          // יחידת מידה: קר/יח
  is_frozen?: boolean;   // האם המוצר קפוא
  package_amount?: number | string; // כמות יחידות בקרטון
  quantity_increment?: number; // קפיצות כמות
  description?: string;
  category?: string;
  cylinder_type?: string; // סוג בלון גז
  available?: boolean;
  featured?: boolean;
  createdAt?: string;
}


export const hebrewDays = [
  { id: "sunday", name: "ראשון" },
  { id: "monday", name: "שני" },
  { id: "tuesday", name: "שלישי" },
  { id: "wednesday", name: "רביעי" },
  { id: "thursday", name: "חמישי" },
  { id: "friday", name: "שישי" }
];

// Default quantity options for backward compatibility
// This is now mainly used as a fallback - actual options are calculated in ProductDialog
export const quantityOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Maximum quantities for different product types
export const MAX_FROZEN_QUANTITY = 100; // עד 100 קרטונים למוצרים קפואים
export const MAX_FRESH_QUANTITY = 1000; // עד 1000 יחידות למוצרים טריים
