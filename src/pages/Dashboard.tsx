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
  ArrowRightCircle,
  ArrowUpRight
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
const quarters = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
const yearsList = ["2023", "2024", "2025", "2026"];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeframeType, setTimeframeType] = useState<string>("annually");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedSubValue, setSelectedSubValue] = useState<string>("");

  const [clickedMonthIdx, setClickedMonthIdx] = useState<number | null>(null);

  // --- DB STATE ---
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    fetchInitialData();

    // REALTIME: Listen for ALL changes (Insert, Update, Delete) to keep dashboard in sync
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
    // 1. Attempt to fetch raw bookings first (easiest to succeed)
    console.log("Fetching bookings...");
    
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

    console.log("Bookings loaded:", data);
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
  
      // Update local state so the list updates immediately
      const updatedBookings = bookings.map((b) => (b.booking_id === bookingId ? { ...b, status: newStatus } : b));
      setBookings(updatedBookings);
      
      // Update the modal view instantly if it's open
      if (selectedBooking && selectedBooking.booking_id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
      
      alert(`Status updated to: ${newStatus}`);
    } catch (err: any) {
      console.error("Update Error:", err.message);
      alert("Failed to update status");
    }
  };

  const handleTypeChange = (val: string) => {
    setTimeframeType(val);
    if (val === "monthly") setSelectedSubValue("January");
    if (val === "quarterly") setSelectedSubValue("Q1 (Jan-Mar)");
    if (val === "annually") setSelectedSubValue("");
    setClickedMonthIdx(null);
  };

  // --- CALCULATIONS ---
  const currentRevenue = useMemo(() => {
    const filteredByRange = bookings.filter((booking) => {
      const dateStr = booking.travel_date || booking.created_at;
      const bookingDate = new Date(dateStr);
      const bMonth = bookingDate.getMonth();
      const bYear = bookingDate.getFullYear().toString();

      if (bYear !== selectedYear) return false;

      if (timeframeType === "monthly") {
        return months[bMonth] === selectedSubValue;
      }
      if (timeframeType === "quarterly") {
        const qIndex = quarters.indexOf(selectedSubValue);
        const bookingQ = Math.floor(bMonth / 3);
        return bookingQ === qIndex;
      }
      // annually — no further filtering
      return true;
    });

    return filteredByRange.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  }, [timeframeType, selectedYear, selectedSubValue, bookings]);

  const touristTrafficData = useMemo(() => {
    const prevYear = (parseInt(selectedYear) - 1).toString();
    const data = months.map(m => ({ name: m.substring(0, 3), travelers: 0, prevYearTravelers: 0 }));
    bookings.forEach(booking => {
      const dateStr = booking.travel_date || booking.created_at;
      const date = new Date(dateStr);
      const monthIndex = date.getMonth();
      const year = date.getFullYear().toString();
      if (year === selectedYear) data[monthIndex].travelers += (Number(booking.pax_count) || 0);
      else if (year === prevYear) data[monthIndex].prevYearTravelers += (Number(booking.pax_count) || 0);
    });
    return data;
  }, [bookings, selectedYear]);

  const monthlyInsightData = useMemo(() => {
    if (clickedMonthIdx === null) return null;
    const monthlyBookings = bookings.filter(b => {
      const dateStr = b.travel_date || b.created_at;
      const d = new Date(dateStr);
      return d.getFullYear().toString() === selectedYear && d.getMonth() === clickedMonthIdx;
    });

    if (monthlyBookings.length === 0) return null;

    const totalCompletedMonthlyRev = monthlyBookings
      .filter(b => b.status?.toLowerCase() === "completed")
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

    const tourStats: Record<string, { count: number; completedRev: number; travelers: number; title: string }> = {};

    monthlyBookings.forEach(b => {
      const key = b.package_id || b.package?.id || "custom";
      const title = b.package?.title || "Custom Itinerary";
      if (!tourStats[key]) tourStats[key] = { count: 0, completedRev: 0, travelers: 0, title };
      tourStats[key].count += 1;
      tourStats[key].travelers += (Number(b.pax_count) || 0);
      if (b.status?.toLowerCase() === "completed") {
        tourStats[key].completedRev += (Number(b.total_price) || 0);
      }
    });

    const topKey = Object.keys(tourStats).reduce((a, b) =>
      tourStats[a].count > tourStats[b].count ? a : b
    );
    const topTour = tourStats[topKey];

    const share = totalCompletedMonthlyRev > 0
      ? Math.round((topTour.completedRev / totalCompletedMonthlyRev) * 100)
      : 0;

    return {
      title: topTour.title,
      travelerCount: topTour.travelers,
      revenueShare: share,
      totalRevenue: topTour.completedRev,
    };
  }, [clickedMonthIdx, selectedYear, bookings]);

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
    if (s === "pending") return "bg-orange-100 text-orange-800 border-orange-200"; // Queue color
    if (s === "paid") return "bg-blue-100 text-blue-800 border-blue-200"; // New Initial color
    if (s === "cancelled") return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800";
  };

  const destinationData = [
    { name: "Nagoya", value: 45 },
    { name: "Tokyo", value: 32 },
    { name: "Hiroshima", value: 28 },
    { name: "Kyoto", value: 15 },
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

        {/* --- REVENUE & POPULAR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white shadow-sm border-l-4 border-l-green-600">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
                <CardDescription>Filtering by {timeframeType} details</CardDescription>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <JapaneseYen className="w-6 h-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="grid gap-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">View Type</label>
                  <select
                    value={timeframeType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="text-sm border-b-2 border-gray-200 py-1 bg-transparent outline-none font-semibold transition-all"
                  >
                    <option value="annually">Annually</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Select Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => { setSelectedYear(e.target.value); setClickedMonthIdx(null); }}
                    className="text-sm border-b-2 border-gray-200 py-1 bg-transparent outline-none font-semibold transition-all"
                  >
                    {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                {timeframeType !== "annually" && (
                  <div className="grid gap-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">
                      {timeframeType === "monthly" ? "Select Month" : "Select Quarter"}
                    </label>
                    <select
                      value={selectedSubValue}
                      onChange={(e) => setSelectedSubValue(e.target.value)}
                      className="text-sm border-b-2 border-gray-200 py-1 bg-transparent outline-none font-semibold transition-all"
                    >
                      {timeframeType === "monthly"
                        ? months.map(m => <option key={m} value={m}>{m}</option>)
                        : quarters.map(q => <option key={q} value={q}>{q}</option>)
                      }
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-gray-900 tracking-tighter">
                    ¥{currentRevenue.toLocaleString()}
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
                                innerRadius={50} 
                                outerRadius={70} 
                                paddingAngle={8} 
                                dataKey="value"
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

        {/* --- TRAFFIC TRENDS + MONTHLY INSIGHTS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-3 shadow-sm border-t-4 border-t-blue-500">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Tourist Traffic Trend: {selectedYear}
                </CardTitle>
                <CardDescription>Click a data point to analyze monthly sales activity</CardDescription>
              </div>
              <div className="flex gap-4 text-xs font-bold text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded-full" /> {selectedYear}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 rounded-full" /> Previous Year
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={touristTrafficData}
                    onClick={(data) => {
                      if (data && data.activeTooltipIndex !== undefined)
                        setClickedMonthIdx(data.activeTooltipIndex);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ stroke: '#2563EB', strokeWidth: 2 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="prevYearTravelers" stroke="#E5E7EB" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line
                      type="monotone"
                      dataKey="travelers"
                      stroke="#2563EB"
                      strokeWidth={4}
                      dot={{ r: 6, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 shadow-sm border-t-4 border-t-indigo-500 relative overflow-hidden bg-white">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-gray-500 flex items-center gap-2">
                <Info className="w-4 h-4" /> Monthly Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {monthlyInsightData ? (
                <>
                  <div>
                    <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Active Period</p>
                    <p className="text-2xl font-black text-gray-900">{months[clickedMonthIdx!]} {selectedYear}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-indigo-600 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Top Tour
                      </p>
                      <p className="text-lg font-bold text-gray-900 leading-tight">{monthlyInsightData.title}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">Travelers</p>
                        <p className="text-xl font-bold flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" /> {monthlyInsightData.travelerCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">Revenue Share</p>
                        <p className={`text-xl font-bold flex items-center gap-1 ${monthlyInsightData.revenueShare > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          <ArrowUpRight className="w-4 h-4" /> {monthlyInsightData.revenueShare}%
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-500"
                          style={{ width: `${monthlyInsightData.revenueShare}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium italic">
                        {monthlyInsightData.revenueShare > 0
                          ? `Contributing ¥${monthlyInsightData.totalRevenue.toLocaleString()} in realized revenue.`
                          : "Revenue pending trip completion."}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-56 text-center opacity-40">
                  <TrendingUp className="w-10 h-10 mb-2 text-gray-300" />
                  <p className="text-sm text-gray-600 px-4">Click a point on the chart to see {selectedYear}'s performance details.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                            <span className="font-semibold text-blue-600">
                            {booking.travel_date || "Not set"}
                            </span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Group Size</span>
                            <span className="font-semibold text-gray-800">{booking.pax_count} Travelers</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-gray-400 block uppercase text-[10px] font-bold">Total Paid</span>
                            <span className="font-bold text-green-700 text-lg">¥{Number(booking.total_price).toLocaleString()}</span>
                        </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-blue-600 hover:bg-blue-50"
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
                                    <DialogDescription>
                                    Manage workflow for Booking ID: #{booking.booking_id}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-6 py-4">
                                    {/* INFO GRID */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Customer Info</h5>
                                            <p className="font-bold text-gray-900">{booking.user?.full_name || "Guest"}</p>
                                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                                <Mail className="w-3 h-3" /> {booking.created_by}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                            <h5 className="text-xs font-bold text-green-600 uppercase mb-2">Revenue</h5>
                                            <p className="text-2xl font-black text-green-700">¥{Number(booking.total_price).toLocaleString()}</p>
                                            <p className="text-xs text-green-600 italic">Confirmed Transaction</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="font-bold text-gray-900 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-red-500" /> Logistics Status
                                        </h5>
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

                                    {/* WORKFLOW ACTION BUTTONS */}
                                    <div className="flex flex-col gap-3 pt-4 border-t">
                                        {/* STEP 1: PAID -> PENDING (QUEUE) */}
                                        {booking.status === "Paid" && (
                                            <Button 
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                                                onClick={() => updateBookingStatus(booking.booking_id, "Pending")}
                                            >
                                                <Clock className="w-4 h-4 mr-2" /> Move to Queue (Pending)
                                            </Button>
                                        )}

                                        {/* STEP 2: PENDING -> CONFIRMED */}
                                        {booking.status === "Pending" && (
                                            <Button 
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => updateBookingStatus(booking.booking_id, "Confirmed")}
                                            >
                                                <ArrowRightCircle className="w-4 h-4 mr-2" /> Confirm Final Logistics
                                            </Button>
                                        )}

                                        {/* STEP 3: CONFIRMED -> COMPLETED */}
                                        {booking.status === "Confirmed" && (
                                            <Button 
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                                onClick={() => updateBookingStatus(booking.booking_id, "Completed")}
                                            >
                                                <CheckCircle className="w-4 h-4 mr-2" /> Mark as Completed
                                            </Button>
                                        )}

                                        <div className="flex gap-3 mt-2">
                                            <Button variant="outline" className="flex-1 border-gray-300">
                                                Contact Customer
                                            </Button>
                                            {booking.status !== "Completed" && booking.status !== "Cancelled" && (
                                                <Button 
                                                    variant="outline" 
                                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                                                    onClick={() => updateBookingStatus(booking.booking_id, "Cancelled")}
                                                >
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