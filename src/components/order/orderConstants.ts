
// New type definition for order products that includes sku field
export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  sku: string;
  description?: string;
  category?: string;
  available?: boolean;
  featured?: boolean;
  createdAt?: string;
}

// Sample products for now - in real app would come from Supabase
export const products: OrderProduct[] = [
  {
    id: "110",
    name: "פיתה אסלית פלאפל במקאה",
    price: 15,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-110",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "111",
    name: "פיתה אסלית שווארמה במקאה",
    price: 18,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-111",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "112",
    name: "פיתה ביס (פרוסה) במקאה",
    price: 12,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-112",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "113",
    name: "פיתה אסלית קמח מלא במקאה",
    price: 16,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-113",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "13",
    name: "לאפות",
    price: 20,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-13",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "114",
    name: "בגט",
    price: 10,
    image: "/lovable-uploads/1c64f1d7-4732-4bb7-b120-01c462fcbf1b.png",
    sku: "מק\"ט-114",
    description: "",
    category: "",
    available: true,
    featured: false,
    createdAt: new Date().toISOString()
  }
];

export const quantityOptions = [0, 50, 100, 150, 200, 250, 300];

export const hebrewDays = [
  { id: "sunday", name: "ראשון" },
  { id: "monday", name: "שני" },
  { id: "tuesday", name: "שלישי" },
  { id: "wednesday", name: "רביעי" },
  { id: "thursday", name: "חמישי" },
  { id: "friday", name: "שישי" }
];
