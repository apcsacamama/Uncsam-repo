import {
  TourPackage,
  Destination,
  Booking,
  DashboardStats,
} from "../types/travel";

export const destinations: Destination[] = [
  {
    id: "1",
    name: "Nagoya Castle",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
    description: "Historic castle in the heart of Nagoya",
  },
  {
    id: "2",
    name: "Legoland",
    image:
      "https://images.unsplash.com/photo-1544985361-b420d7a77043?w=800&h=600&fit=crop",
    description: "Family fun at Legoland Japan",
  },
  {
    id: "3",
    name: "Science Museum",
    image:
      "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop",
    description: "Interactive science exhibits",
  },
  {
    id: "4",
    name: "Oasis 21",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
    description: "Modern shopping and entertainment complex",
  },
  {
    id: "5",
    name: "Noritake Garden",
    image:
      "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=800&h=600&fit=crop",
    description: "Beautiful gardens and pottery museum",
  },
  {
    id: "6",
    name: "Public Aquarium",
    image:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
    description: "Marine life and underwater adventures",
  },
];

export const tourPackages: TourPackage[] = [
  {
    id: "tokyo-disney",
    title: "Tokyo Disney Transportation",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    price: 15000,
    destinations: ["Tokyo Disneyland", "Tokyo DisneySea"],
    inclusions: ["Round-trip transportation", "Park tickets", "Lunch voucher"],
    description:
      "Experience the magic of Disney with convenient transportation",
    duration: "1 Day",
    featured: true,
  },
  {
    id: "nagoya-tour",
    title: "Nagoya Tour Package",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
    price: 79000,
    originalPrice: 85000,
    destinations: [
      "Nagoya Castle",
      "Legoland",
      "Science Museum",
      "Oasis 21",
      "Noritake Garden",
      "Public Aquarium",
    ],
    inclusions: [
      "12-Hour Tour",
      "Private Tour",
      "Hotel Pick-up",
      "Hotel Drop-off",
      "Driver",
    ],
    description: "Complete Nagoya experience with all major attractions",
    duration: "2 Days",
    featured: true,
  },
  {
    id: "fukuoka-adventure",
    title: "Fukuoka Adventure",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop",
    price: 65000,
    destinations: ["Fukuoka Tower", "Ohori Park", "Dazaifu", "Canal City"],
    inclusions: ["Transportation", "Guide", "Meals"],
    description: "Discover the beauty of Fukuoka",
    duration: "3 Days",
  },
  {
    id: "hiroshima-peace",
    title: "Hiroshima Peace Tour",
    image:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop",
    price: 45000,
    destinations: [
      "Peace Memorial Park",
      "Miyajima Island",
      "Hiroshima Castle",
    ],
    inclusions: ["Guide", "Ferry tickets", "Lunch"],
    description: "Historical and cultural journey through Hiroshima",
    duration: "1 Day",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "book-001",
    userId: "user-001",
    packageId: "nagoya-tour",
    customerName: "John Smith",
    email: "john@email.com",
    phone: "+81-90-1234-5678",
    travelDate: "2024-02-15",
    travelers: 2,
    totalPrice: 158000,
    status: "confirmed",
    createdAt: "2024-01-15",
  },
  {
    id: "book-002",
    userId: "user-002",
    packageId: "tokyo-disney",
    customerName: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+81-90-2345-6789",
    travelDate: "2024-02-20",
    travelers: 4,
    totalPrice: 60000,
    status: "pending",
    createdAt: "2024-01-20",
  },
  {
    id: "book-003",
    userId: "user-003",
    packageId: "fukuoka-adventure",
    customerName: "Mike Davis",
    email: "mike@email.com",
    phone: "+81-90-3456-7890",
    travelDate: "2024-03-01",
    travelers: 1,
    totalPrice: 65000,
    status: "completed",
    createdAt: "2024-01-10",
  },
];

export const dashboardStats: DashboardStats = {
  totalBookings: 156,
  totalRevenue: 12400000,
  pendingBookings: 23,
  completedBookings: 133,
};
