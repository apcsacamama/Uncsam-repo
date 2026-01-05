import { supabase } from "../lib/supabaseClient"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Eye,
  Edit,
  JapaneseYen,
  TrendingUp,
  MapPin,
  Calendar,
  Users
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";


// --- LOCAL DATA ---
const mockBookings = [
  { id: 1, customerName: "Alice Johnson", email: "alice@example.com", status: "pending", packageId: 1, travelDate: "2025-04-10", travelers: 2, totalPrice: 240000 },
  { id: 2, customerName: "Bob Smith", email: "bob@example.com", status: "completed", packageId: 2, travelDate: "2023-12-15", travelers: 1, totalPrice: 150000 },
  { id: 3, customerName: "Charlie Brown", email: "charlie@example.com", status: "confirmed", packageId: 3, travelDate: "2025-05-20", travelers: 4, totalPrice: 500000 },
  { id: 4, customerName: "Diana Prince", email: "diana@example.com", status: "pending", packageId: 1, travelDate: "2025-06-01", travelers: 2, totalPrice: 240000 },
  { id: 5, customerName: "Evan Wright", email: "evan@example.com", status: "completed", packageId: 2, travelDate: "2024-01-10", travelers: 1, totalPrice: 150000 },
  { id: 6, customerName: "Fiona Gallagher", email: "fiona@example.com", status: "confirmed", packageId: 3, travelDate: "2025-08-15", travelers: 3, totalPrice: 375000 },
];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Revenue Range State
  const [startMonth, setStartMonth] = useState<string>("January");
  const [endMonth, setEndMonth] = useState<string>("December");

  const [packages, setPackages] = useState<any[]>([]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase.from('tour_packages').select('*');
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    }
  };

  const currentRevenue = useMemo(() => {
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);

    const filteredByRange = mockBookings.filter((booking) => {
      const bookingDate = new Date(booking.travelDate);
      const bookingMonthIndex = bookingDate.getMonth();
      
      // Handle Wrap around (e.g., Nov to Feb) or Standard (Jan to Mar)
      if (startIndex <= endIndex) {
        return bookingMonthIndex >= startIndex && bookingMonthIndex <= endIndex;
      } else {
        // Range wraps around year end (e.g. Sept to Mar)
        return bookingMonthIndex >= startIndex || bookingMonthIndex <= endIndex;
      }
    });

    return filteredByRange.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [startMonth, endMonth]);

  // --- TOURIST TRAFFIC DATA (Line Chart) ---
  const touristTrafficData = useMemo(() => {
    // Initialize all months with 0
    const data = months.map(m => ({ name: m.substring(0, 3), travelers: 0 }));
    
    mockBookings.forEach(booking => {
      const date = new Date(booking.travelDate);
      const monthIndex = date.getMonth();
      data[monthIndex].travelers += booking.travelers;
    });

    return data;
  }, []);

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const destinationData = [
    { name: "Nagoya", value: 45 },
    { name: "Tokyo", value: 32 },
    { name: "Hiroshima", value: 28 },
    { name: "Kyoto", value: 15 },
  ];
  const PIE_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#9333EA"];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">Hi UncleSam!</h1>
           <p className="text-gray-500">Overview of performance and bookings</p>
        </div>

        {/* --- TOP SECTION: Revenue & Popular Destinations --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* REVENUE CARD (With Range) */}
          <Card className="lg:col-span-2 bg-white shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
                <CardDescription>Filter by month range</CardDescription>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <JapaneseYen className="w-6 h-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                 <div className="flex items-center gap-2">
                    <div className="grid gap-1">
                        <label className="text-xs font-semibold text-gray-500">From</label>
                        <select 
                            value={startMonth} 
                            onChange={(e) => setStartMonth(e.target.value)}
                            className="text-sm border rounded-md p-2 bg-gray-50"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <span className="text-gray-400 mt-5">-</span>
                    <div className="grid gap-1">
                        <label className="text-xs font-semibold text-gray-500">To</label>
                        <select 
                            value={endMonth} 
                            onChange={(e) => setEndMonth(e.target.value)}
                            className="text-sm border rounded-md p-2 bg-gray-50"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-gray-900">
                    ¥{currentRevenue.toLocaleString()}
                </span>
                <span className="flex items-center text-sm text-green-600 font-medium">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Based on selection
                </span>
              </div>
            </CardContent>
          </Card>

          {/* POPULAR DESTINATIONS (Moved to Top) */}
          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Popular Destinations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[180px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={destinationData} 
                                cx="50%" cy="50%" 
                                innerRadius={40} 
                                outerRadius={60} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {destinationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] text-center pointer-events-none">
                        
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* --- MIDDLE SECTION: Tourist Traffic Line Graph --- */}
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tourist Traffic Trends
                </CardTitle>
                <CardDescription>Number of travelers per month based on bookings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={touristTrafficData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="travelers" 
                                stroke="#2563EB" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: "#2563EB" }} 
                                activeDot={{ r: 6 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* --- BOTTOM SECTION: Recent Bookings --- */}
        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Bookings</CardTitle>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                            placeholder="Search..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-8 h-9 w-[200px]" 
                        />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)} 
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                            <p className="text-sm text-gray-600">{booking.email}</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                            <span className="font-medium text-gray-900 block">Package</span>
                            {packages.find((p) => p.id === booking.packageId)?.title || "Unknown"}
                        </div>
                        <div>
                            <span className="font-medium text-gray-900 block">Travel Date</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {booking.travelDate}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-900 block">Travelers</span>
                            {booking.travelers} people
                        </div>
                        <div>
                            <span className="font-medium text-gray-900 block">Total</span>
                            <span className="font-bold text-red-600">¥{booking.totalPrice.toLocaleString()}</span>
                        </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button size="sm" variant="ghost"><Eye className="w-4 h-4 mr-1" /> View Details</Button>
                        </div>
                    </div>
                    ))}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}