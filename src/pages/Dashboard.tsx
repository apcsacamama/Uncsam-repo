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
  JapaneseYen,
  TrendingUp,
  Calendar,
  Users,
  Loader2,
  MapPin,
  Mail,
  Info,
  CheckCircle,
  Clock,
  ArrowRightCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
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

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startMonth, setStartMonth] = useState<string>("January");
  const [endMonth, setEndMonth] = useState<string>("December");
  // --- TIMEFRAME STATE FROM 2ND CODE ---
  const [timeframe, setTimeframe] = useState<"monthly" | "quarterly" | "annually">("monthly");

  // --- DB STATE ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();

    const channel = supabase
      .channel('dashboard-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bookings' }, 
        () => fetchInitialData() 
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          user:user_id (full_name) 
        `) 
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Dashboard Fetch Error:", error.message);
        alert("Error loading data: " + error.message);
        return;
      }
      setBookings(data || []);
    } catch (err: any) {
      console.error("Unexpected Error:", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('booking_id', bookingId);
  
      if (error) throw error;
  
      const updatedBookings = bookings.map((b) => (b.booking_id === bookingId ? { ...b, status: newStatus } : b));
      setBookings(updatedBookings);
      
      if (selectedBooking && selectedBooking.booking_id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      
      alert(`Status updated to: ${newStatus}`);
    } catch (err: any) {
      console.error("Update Error:", err.message);
      alert("Failed to update status");
    }
  };

  // --- MERGED REVENUE LOGIC (Supporting Timeframes + Decimals) ---
  const currentRevenue = useMemo(() => {
    const startIndex = months.indexOf(startMonth);
    const endIndex = months.indexOf(endMonth);

    const filteredByRange = bookings.filter((booking) => {
      const dateStr = booking.travel_date || booking.created_at;
      const bookingDate = new Date(dateStr);
      const bookingMonthIndex = bookingDate.getMonth();
      
      if (startIndex <= endIndex) {
        return bookingMonthIndex >= startIndex && bookingMonthIndex <= endIndex;
      } else {
        return bookingMonthIndex >= startIndex || bookingMonthIndex <= endIndex;
      }
    });

    return filteredByRange.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  }, [startMonth, endMonth, bookings]);

  // --- TRAFFIC DATA ---
  const touristTrafficData = useMemo(() => {
    const data = months.map(m => ({ name: m.substring(0, 3), travelers: 0 }));
    bookings.forEach(booking => {
      const dateStr = booking.travel_date || booking.created_at;
      const date = new Date(dateStr);
      const monthIndex = date.getMonth();
      data[monthIndex].travelers += (Number(booking.pax_count) || 0);
    });
    return data;
  }, [bookings]);

  // --- FILTERED LIST ---
  const filteredBookings = bookings.filter((booking) => {
    const name = booking.user?.full_name?.toLowerCase() || booking.created_by?.toLowerCase() || "";
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || booking.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "completed") return "bg-emerald-100 text-emerald-800 border-emerald-200"; 
    if (s === "confirmed") return "bg-green-100 text-green-800 border-green-200";
    if (s === "pending") return "bg-orange-100 text-orange-800 border-orange-200";
    if (s === "paid") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800";
  };

  const destinationData = [
    { name: "Nagoya", value: 45 }, { name: "Tokyo", value: 32 },
    { name: "Hiroshima", value: 28 }, { name: "Kyoto", value: 15 },
  ];
  const PIE_COLORS = ["#DC2626", "#2563EB", "#16A34A", "#9333EA"];

  if (isLoading && bookings.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Hi UncleSam!</h1>
                <p className="text-gray-500">Overview of performance and {bookings.length} live bookings</p>
            </div>
            <Button onClick={fetchInitialData} variant="outline" size="sm" className="bg-white">
               {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null} Refresh Data
            </Button>
        </div>

        {/* --- REVENUE & POPULAR (Merged with Monthly/Quarterly/Annually) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white shadow-sm border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
                <div className="flex gap-2 mt-2">
                  {(['monthly', 'quarterly', 'annually'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimeframe(t)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        timeframe === t ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <JapaneseYen className="w-6 h-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
                 <div className="flex items-center gap-2">
                    <div className="grid gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">From</label>
                        <select 
                            value={startMonth} 
                            onChange={(e) => setStartMonth(e.target.value)}
                            className="text-sm border rounded-md p-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <span className="text-gray-400 mt-5">to</span>
                    <div className="grid gap-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">To</label>
                        <select 
                            value={endMonth} 
                            onChange={(e) => setEndMonth(e.target.value)}
                            className="text-sm border rounded-md p-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                 </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                    ¥{currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                    <TrendingUp className="w-3 h-3 mr-1" /> LIVE
                </Badge>
              </div>
            </CardContent>
          </Card>

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
                                innerRadius={50} outerRadius={70} 
                                paddingAngle={8} dataKey="value"
                            >
                                {destinationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* --- TRAFFIC TRENDS --- */}
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tourist Traffic Trends
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={touristTrafficData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                            <Line 
                                type="monotone" 
                                dataKey="travelers" 
                                stroke="#2563EB" 
                                strokeWidth={4} 
                                dot={{ r: 6, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }} 
                                activeDot={{ r: 8, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* --- BOOKINGS TABLE --- */}
        <Card className="shadow-sm border-t-4 border-t-blue-600">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Showing {filteredBookings.length} filtered results</CardDescription>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input 
                            placeholder="Search customer..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-8 h-10 w-[250px] bg-white" 
                        />
                    </div>
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)} 
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white shadow-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending (Queue)</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredBookings.map((booking) => (
                    <div key={booking.booking_id} className="border rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white group">
                        <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">
                            {booking.user?.full_name || booking.created_by || "Guest Traveler"}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-mono">#{booking.booking_id}</Badge>
                            <span className="text-xs text-gray-400 flex items-center">
                                <Calendar className="w-3 h-3 mr-1"/> 
                                Booked: {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "Pending"}
                            </span>
                            </div>
                        </div>
                        <Badge className={`${getStatusColor(booking.status)} px-3 py-1 border`}>{booking.status}</Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Tour Package</span>
                            <span className="font-semibold text-gray-800 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500"/> 
                            {booking.package?.title || "Custom Itinerary"}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Travel Date</span>
                            <span className="font-semibold text-blue-600">{booking.travel_date || "Not set"}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Group Size</span>
                            <span className="font-semibold text-gray-800">{booking.pax_count} Travelers</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Total Paid</span>
                            <span className="font-bold text-green-700 text-lg">¥{Number(booking.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                <Button 
                                    size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-50"
                                    onClick={() => setSelectedBooking(booking)}
                                >
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                        <Info className="w-6 h-6 text-blue-600" /> Booking Management
                                    </DialogTitle>
                                    <DialogDescription>Manage workflow for Booking ID: #{booking.booking_id}</DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Customer Info</h5>
                                            <p className="font-bold text-gray-900">{booking.user?.full_name || "Guest"}</p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1"><Mail className="w-3 h-3" /> {booking.created_by}</p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <h5 className="text-xs font-bold text-green-600 uppercase mb-2">Revenue</h5>
                                            <p className="text-2xl font-black text-green-700">¥{Number(booking.total_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                            <p className="text-xs text-green-600 italic">Confirmed Transaction</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="font-bold text-gray-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Logistics Status</h5>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm border rounded-xl p-4">
                                            <div>
                                                <p className="text-gray-400 uppercase text-[10px] font-bold">Package Name</p>
                                                <p className="font-semibold text-gray-800">{booking.package?.title || "Custom Itinerary"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-400 uppercase text-[10px] font-bold">Travel Date</p>
                                                <p className="font-semibold text-blue-600">{booking.travel_date || "TBD"}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-gray-400 uppercase text-[10px] font-bold">Current Status</p>
                                                <Badge className={`${getStatusColor(booking.status)} mt-1`}>{booking.status}</Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 pt-4 border-t">
                                        {booking.status === "Paid" && (
                                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => updateBookingStatus(booking.booking_id, "Pending")}>
                                                <Clock className="w-4 h-4 mr-2" /> Move to Queue (Pending)
                                            </Button>
                                        )}
                                        {booking.status === "Pending" && (
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateBookingStatus(booking.booking_id, "Confirmed")}>
                                                <ArrowRightCircle className="w-4 h-4 mr-2" /> Confirm Final Logistics
                                            </Button>
                                        )}
                                        {booking.status === "Confirmed" && (
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateBookingStatus(booking.booking_id, "Completed")}>
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark as Completed
                                            </Button>
                                        )}
                                        <div className="flex gap-3 mt-2">
                                            <Button variant="outline" className="flex-1 border-gray-300">Contact Customer</Button>
                                            {booking.status !== "Completed" && booking.status !== "Cancelled" && (
                                                <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateBookingStatus(booking.booking_id, "Cancelled")}>
                                                    Cancel Booking
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    ))}
                    {filteredBookings.length === 0 && (
                      <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
                        <p className="text-gray-400">No bookings match your search criteria.</p>
                      </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}