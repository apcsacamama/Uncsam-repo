import {
  TourPackage,
  Booking,
  DashboardStats,
} from "../types/travel";

export const tourPackages: TourPackage[] = []; 

// --- MOCK BOOKINGS ---
// (Keep this until we create a 'bookings' table in Supabase)
export const mockBookings: Booking[] = [
  {
    id: "book-001",
    userId: "user-001",
    packageId: "nara-tour", // Ensure this ID matches a row in your Supabase table
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

// --- DASHBOARD STATS ---
// (Keep this until we calculate real stats from Supabase)
export const dashboardStats: DashboardStats = {
  totalBookings: 156,
  totalRevenue: 12400000,
  pendingBookings: 23,
  completedBookings: 133,
};