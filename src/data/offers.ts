import {
  TourPackage,
  Destination,
  Booking,
  DashboardStats,
} from "../types/travel";

// --- 1. POPULAR DESTINATIONS (Representative images for the carousel) ---
export const destinations: Destination[] = [
  {
    id: "1",
    name: "Tokyo Disneyland",
    image:
      "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&h=600&fit=crop",
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

// --- 2. TOUR PACKAGES (Strictly matching your provided list) ---
export const tourPackages: TourPackage[] = [
  // --- TOKYO ---
  {
    id: "tokyo-disney-large",
    title: "Tokyo Disney Transfer (Large Group)",
    image:
      "https://images.unsplash.com/photo-1628047648353-7649c0903332?w=800&h=600&fit=crop",
    price: 80000,
    destinations: ["Tokyo Disneyland", "Tokyo DisneySea"],
    inclusions: [
      "Private Van Transfer",
      "Hotel Pick-up & Drop-off",
      "Gas & Tolls",
    ],
    description: "Comfortable transfer for larger groups (7-9 travelers).",
    duration: "1 Day",
    featured: true,
  },
  {
    id: "tokyo-disney-small",
    title: "Tokyo Disney Transfer (Small Group)",
    image:
      "https://images.unsplash.com/photo-1505928738367-1725515d4813?w=800&h=600&fit=crop", // Different angle/vibes
    price: 60000,
    destinations: ["Tokyo Disneyland", "Tokyo DisneySea"],
    inclusions: [
      "Private Van Transfer",
      "Hotel Pick-up & Drop-off",
      "Gas & Tolls",
    ],
    description: "Convenient transfer for small groups (1-6 travelers).",
    duration: "1 Day",
    featured: false,
  },

  // --- NARA ---
  {
    id: "nara-tour-large",
    title: "Nara Historical Tour (Large Group)",
    image:
      "https://images.unsplash.com/photo-1565551932402-9a3b8396078d?w=800&h=600&fit=crop",
    price: 105000,
    destinations: [
      "Todai-ji Temple",
      "Nara Park",
      "Kasuga Taisha Shrine",
      "Nigatsu-do Hall",
      "Yoshikien Garden",
    ],
    inclusions: [
      "10-Hour Private Tour",
      "Professional Driver",
      "Hotel Pick-up & Drop-off",
    ],
    description: "Explore ancient Nara. Best for 7-9 travelers.",
    duration: "1 Day",
    featured: true,
  },
  {
    id: "nara-tour-small",
    title: "Nara Historical Tour (Small Group)",
    image:
      "https://images.unsplash.com/photo-1579409893817-5e1610427324?w=800&h=600&fit=crop", // Deer focus
    price: 85000,
    destinations: [
      "Todai-ji Temple",
      "Nara Park",
      "Kasuga Taisha Shrine",
      "Nigatsu-do Hall",
      "Yoshikien Garden",
    ],
    inclusions: [
      "10-Hour Private Tour",
      "Professional Driver",
      "Hotel Pick-up & Drop-off",
    ],
    description: "Explore ancient Nara. Best for 1-6 travelers.",
    duration: "1 Day",
    featured: false,
  },

  // --- FUKUOKA (Added Kushida Shrine to make 5 destinations) ---
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
      "Kushida Shrine",
      "Canal City Hakata",
    ],
    inclusions: ["Private Transportation", "Driver", "Flexible Itinerary"],
    description: "Discover the vibrant culture and food of Fukuoka.",
    duration: "1 Day",
  },

  // --- FUKUI ---
  {
    id: "fukui-tour",
    title: "Fukui Nature & History",
    image:
      "https://images.unsplash.com/photo-1624623439906-8c9096732367?w=800&h=600&fit=crop",
    price: 60000,
    destinations: [
      "Fukui Dinosaur Museum",
      "Eiheiji Temple",
      "Tojinbo Cliffs",
      "Maruoka Castle",
    ],
    inclusions: ["Private Transportation", "Driver", "Gas & Tolls"],
    description: "Explore the scenic cliffs and history of Fukui.",
    duration: "1 Day",
  },

  // --- HIROSHIMA ---
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
      "Shukkeien Garden",
    ],
    inclusions: ["Private Transportation", "Driver", "Ferry Logistics Support"],
    description: "A moving journey through history.",
    duration: "1 Day",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "book-001",
    userId: "user-001",
    packageId: "nara-tour-small", // Updated ID to match new schema
    customerName: "John Smith",
    email: "john@email.com",
    phone: "+81-90-1234-5678",
    travelDate: "2024-02-15",
    travelers: 4,
    totalPrice: 85000,
    status: "confirmed",
    createdAt: "2024-01-15",
  },
  // ... other mock bookings
];

export const dashboardStats: DashboardStats = {
  totalBookings: 156,
  totalRevenue: 12400000,
  pendingBookings: 23,
  completedBookings: 133,
};
