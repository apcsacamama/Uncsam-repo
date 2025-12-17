import {
  TourPackage,
  Destination,
  Booking,
  DashboardStats,
} from "../types/travel";

// --- 1. POPULAR DESTINATIONS (For the "Popular Destinations" Grid) ---
export const destinations: Destination[] = [
  {
    id: "1",
    name: "Tokyo Disneyland",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop", // Placeholder for Disney
    description: "The happiest place on earth",
  },
  {
    id: "2",
    name: "Todai-ji Temple",
    image:
      "https://images.unsplash.com/photo-1594614269894-37f0003cb06c?w=800&h=600&fit=crop",
    description: "Home of the Great Buddha in Nara",
  },
  {
    id: "3",
    name: "Fukuoka Tower",
    image:
      "https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop",
    description: "Iconic landmark of Fukuoka",
  },
  {
    id: "4",
    name: "Tojinbo Cliffs",
    image:
      "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&h=600&fit=crop",
    description: "Rugged scenic cliffs in Fukui",
  },
  {
    id: "5",
    name: "Miyajima Island",
    image:
      "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&h=600&fit=crop",
    description: "Famous floating shrine in Hiroshima",
  },
  {
    id: "6",
    name: "Nara Park",
    image:
      "https://images.unsplash.com/photo-1559317076-2395a123eb4f?w=800&h=600&fit=crop",
    description: "Famous for its friendly bowing deer",
  },
];

// --- 2. TOUR PACKAGES (Updated with your specific prices & tiers) ---
export const tourPackages: TourPackage[] = [
  {
    id: "tokyo-disney",
    title: "Tokyo Disney Transfer",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    price: 60000, // Base price (1-6 pax)
    destinations: ["Tokyo Disneyland", "Tokyo DisneySea"],
    inclusions: [
      "Private Van Transfer", 
      "Hotel Pick-up & Drop-off", 
      "Gas & Tolls"
    ],
    description:
      "Convenient transfer to the parks. Price: ¥60,000 (1-6 travelers), ¥80,000 (7-9 travelers).",
    duration: "1 Day",
    featured: true,
  },
  {
    id: "nara-tour",
    title: "Nara Historical Tour",
    image:
      "https://images.unsplash.com/photo-1565551932402-9a3b8396078d?w=800&h=600&fit=crop",
    price: 85000, // Base price (1-6 pax)
    destinations: [
      "Todai-ji Temple", 
      "Nara Park", 
      "Kasuga Taisha Shrine", 
      "Nigatsu-do Hall", 
      "Yoshikien Garden"
    ],
    inclusions: [
      "10-Hour Private Tour",
      "Professional Driver",
      "Hotel Pick-up & Drop-off",
    ],
    description: "Walk among ancient temples and deer. Price: ¥85,000 (1-6 travelers), ¥105,000 (7-9 travelers).",
    duration: "1 Day",
    featured: true,
  },
  {
    id: "fukuoka-tour",
    title: "Fukuoka City Tour",
    image:
      "https://images.unsplash.com/photo-1558223933-911cb7df4101?w=800&h=600&fit=crop",
    price: 75000,
    destinations: [
      "Fukuoka Tower", 
      "Ohori Park", 
      "Dazaifu Tenmangu", 
      "Canal City Hakata"
    ],
    inclusions: ["Private Transportation", "Driver", "Flexible Itinerary"],
    description: "Discover the vibrant culture and food of Fukuoka.",
    duration: "1 Day",
  },
  {
    id: "fukui-tour",
    title: "Fukui Nature & History",
    image:
      "https://images.unsplash.com/photo-1624623439906-8c9096732367?w=800&h=600&fit=crop", // Placeholder
    price: 60000,
    destinations: [
      "Fukui Dinosaur Museum", 
      "Tojinbo Cliffs", 
      "Eiheiji Temple", 
      "Maruoka Castle"
    ],
    inclusions: ["Private Transportation", "Driver", "Gas & Tolls"],
    description: "Explore the scenic cliffs and history of Fukui prefecture.",
    duration: "1 Day",
  },
  {
    id: "hiroshima-tour",
    title: "Hiroshima Peace Tour",
    image:
      "https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=600&fit=crop",
    price: 85000,
    destinations: [
      "Peace Memorial Park", 
      "Miyajima Island", 
      "Hiroshima Castle", 
      "Shukkeien Garden"
    ],
    inclusions: ["Private Transportation", "Driver", "Ferry Logistics Support"],
    description: "A moving journey through history and scenic beauty.",
    duration: "1 Day",
  },
];

// --- 3. MOCK BOOKINGS (Updated IDs to match new packages) ---
export const mockBookings: Booking[] = [
  {
    id: "book-001",
    userId: "user-001",
    packageId: "nara-tour",
    customerName: "John Smith",
    email: "john@email.com",
    phone: "+81-90-1234-5678",
    travelDate: "2024-02-15",
    travelers: 4,
    totalPrice: 85000,
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
    travelers: 8,
    totalPrice: 80000, // Reflects the 7-9 pax pricing
    status: "pending",
    createdAt: "2024-01-20",
  },
  {
    id: "book-003",
    userId: "user-003",
    packageId: "fukuoka-tour",
    customerName: "Mike Davis",
    email: "mike@email.com",
    phone: "+81-90-3456-7890",
    travelDate: "2024-03-01",
    travelers: 3,
    totalPrice: 75000,
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
