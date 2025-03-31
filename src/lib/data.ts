
import { Category, Order, Product, User } from "@/types";

export const sampleUsers: User[] = [
  {
    id: "user1",
    phone: "+1234567890",
    name: "Admin User",
    role: "admin",
    createdAt: "2023-05-15T10:30:00Z",
  },
  {
    id: "user2",
    phone: "+1987654321",
    name: "John Customer",
    role: "customer",
    createdAt: "2023-06-20T14:45:00Z",
  },
  {
    id: "user3",
    phone: "+1122334455",
    name: "Jane Customer",
    role: "customer",
    createdAt: "2023-07-10T09:15:00Z",
  },
];

export const sampleCategories: Category[] = [
  { id: "cat1", name: "Bread" },
  { id: "cat2", name: "Cakes" },
  { id: "cat3", name: "Pastries" },
  { id: "cat4", name: "Cookies" },
  { id: "cat5", name: "Savory" },
];

export const sampleProducts: Product[] = [
  {
    id: "prod1",
    name: "Sourdough Bread",
    description: "Artisanal sourdough bread made with our special starter.",
    price: 6.99,
    image: "https://images.unsplash.com/photo-1586444248888-d78226f30c3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat1",
    available: true,
    featured: true,
    createdAt: "2023-05-10T08:30:00Z",
  },
  {
    id: "prod2",
    name: "Chocolate Cake",
    description: "Rich and moist chocolate cake with ganache topping.",
    price: 28.99,
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat2",
    available: true,
    featured: true,
    createdAt: "2023-05-12T10:15:00Z",
  },
  {
    id: "prod3",
    name: "Croissant",
    description: "Buttery, flaky French croissant.",
    price: 3.99,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat3",
    available: true,
    featured: false,
    createdAt: "2023-05-14T09:45:00Z",
  },
  {
    id: "prod4",
    name: "Chocolate Chip Cookies",
    description: "Classic chocolate chip cookies with walnuts.",
    price: 1.99,
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat4",
    available: true,
    featured: false,
    createdAt: "2023-05-16T11:20:00Z",
  },
  {
    id: "prod5",
    name: "Spinach Quiche",
    description: "Savory quiche with spinach, feta, and caramelized onions.",
    price: 14.99,
    image: "https://images.unsplash.com/photo-1562621542-c4a1935a85df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat5",
    available: true,
    featured: true,
    createdAt: "2023-05-18T12:10:00Z",
  },
  {
    id: "prod6",
    name: "Baguette",
    description: "Traditional French baguette with crispy crust.",
    price: 4.99,
    image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    category: "cat1",
    available: true,
    featured: false,
    createdAt: "2023-05-20T07:55:00Z",
  },
];

export const sampleOrders: Order[] = [
  {
    id: "order1",
    userId: "user2",
    status: "completed",
    items: [
      {
        productId: "prod1",
        productName: "Sourdough Bread",
        quantity: 2,
        price: 6.99,
      },
      {
        productId: "prod3",
        productName: "Croissant",
        quantity: 3,
        price: 3.99,
      },
    ],
    total: 25.95,
    createdAt: "2023-08-01T15:30:00Z",
  },
  {
    id: "order2",
    userId: "user3",
    status: "processing",
    items: [
      {
        productId: "prod2",
        productName: "Chocolate Cake",
        quantity: 1,
        price: 28.99,
      },
      {
        productId: "prod4",
        productName: "Chocolate Chip Cookies",
        quantity: 6,
        price: 1.99,
      },
    ],
    total: 40.93,
    createdAt: "2023-08-05T10:45:00Z",
  },
  {
    id: "order3",
    userId: "user2",
    status: "pending",
    items: [
      {
        productId: "prod5",
        productName: "Spinach Quiche",
        quantity: 1,
        price: 14.99,
      },
    ],
    total: 14.99,
    createdAt: "2023-08-07T09:20:00Z",
  },
];
