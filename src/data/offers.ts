import {
  TourPackage,
  Booking,
  DashboardStats,
} from "../types/travel";

// --- TOUR PACKAGES (Updated Duration: 12 Hours) ---
export const tourPackages: TourPackage[] = [
  // --- TOKYO ---
  {
    id: "tokyo-disney",
    title: "Tokyo Disney Transfer",
    image:
      "https://images.unsplash.com/photo-1713611494218-b40e2fd63f1c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&h=600&fit=crop",
    price: 60000, // Base price 1-6 pax
    destinations: ["Tokyo Disneyland", "Tokyo DisneySea"],
    inclusions: [
      "Private Van Transfer",
      "Hotel Pick-up & Drop-off",
      "Gas & Tolls",
    ],
    description: "Private transfer. ¥60,000 (1-6 travelers) or ¥80,000 (7-9 travelers).",
    duration: "12 Hours",
    featured: true,
  },

  // --- NARA ---
  {
    id: "nara-tour",
    title: "Nara Historical Tour",
    image:
      "https://images.unsplash.com/photo-1684767942897-60f164e5dbbe?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&h=600&fit=crop",
    price: 85000, // Base price 1-6 pax
    destinations: [
      "Todai-ji Temple",
      "Nara Park",
      "Kasuga Taisha Shrine",
      "Nigatsu-do Hall",
      "Yoshikien Garden",
    ],
    inclusions: [
      "12-Hour Private Tour", // Updated to match
      "Professional Driver",
      "Hotel Pick-up & Drop-off",
    ],
    description: "Explore ancient Nara. ¥85,000 (1-6 travelers) or ¥105,000 (7-9 travelers).",
    duration: "12 Hours",
    featured: true,
  },

  // --- FUKUOKA ---
  {
    id: "fukuoka-tour",
    title: "Fukuoka City Tour",
    image:
      "https://blog.sakura.co/wp-content/uploads/2024/11/fukuoka-thumbnail-nanzoin-temple.webp?w=800&h=600&fit=crop",
    price: 75000,
    destinations: [
      "Fukuoka Tower",
      "Ohori Park",
      "Dazaifu Tenmangu",
      "Kushida Shrine",
      "Canal City Hakata",
    ],
    inclusions: ["Private Transportation", "Driver", "Flexible Itinerary"],
    description: "Discover the vibrant culture and food of Fukuoka. Flat rate: ¥75,000.",
    duration: "12 Hours",
  },

  // --- FUKUI ---
  {
    id: "fukui-tour",
    title: "Fukui Nature & History",
    image:
      "https://images.unsplash.com/photo-1627099177620-7755ca6705b8?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D?w=800&h=600&fit=crop",
    price: 60000,
    destinations: [
      "Fukui Dinosaur Museum",
      "Eiheiji Temple",
      "Tojinbo Cliffs",
      "Maruoka Castle",
    ],
    inclusions: ["Private Transportation", "Driver", "Gas & Tolls"],
    description: "Explore the scenic cliffs and history of Fukui. Flat rate: ¥60,000.",
    duration: "12 Hours",
  },

  // --- HIROSHIMA ---
  {
    id: "hiroshima-tour",
    title: "Hiroshima Peace Tour",
    image:
      "https://images.squarespace-cdn.com/content/v1/6683b1f0c2de43611580eee6/1726290452874-7W40L3SDIT72LT0SN25J/torii-itsukushima-miyajima-hiroshima-eJi6SmBs-0o.jpg?w=800&h=600&fit=crop",
    price: 85000,
    destinations: [
      "Peace Memorial Park",
      "Miyajima Island",
      "Hiroshima Castle",
      "Shukkeien Garden",
    ],
    inclusions: ["Private Transportation", "Driver", "Ferry Logistics Support"],
    description: "A moving journey through history. Flat rate: ¥85,000.",
    duration: "12 Hours",
  },
];

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
];

export const dashboardStats: DashboardStats = {
  totalBookings: 156,
  totalRevenue: 12400000,
  pendingBookings: 23,
  completedBookings: 133,
};
