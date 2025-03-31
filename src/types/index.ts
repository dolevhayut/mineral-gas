
export interface User {
  id: string;
  phone: string;
  name: string;
  role: 'admin' | 'customer';
  sapCustomerId?: string;
  isVerified: boolean;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  featured: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: OrderItem[];
  total: number;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Category {
  id: string;
  name: string;
}
