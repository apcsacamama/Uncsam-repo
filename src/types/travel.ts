export interface Destination {
  id: string;
  name: string;
  image: string;
  description: string;
}

export interface TourPackage {
  id: string;
  title: string;
  image: string;
  price: number;
  originalPrice?: number;
  destinations: string[];
  inclusions: string[];
  description: string;
  duration: string;
  featured?: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  packageId: string;
  customerName: string;
  email: string;
  phone: string;
  travelDate: string;
  travelers: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
}

export interface CustomTour {
  location: string;
  date: string;
  destinations: string[];
  transportation: string[];
  travelers: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "customer" | "owner";
  bookings: string[];
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  completedBookings: number;
}
