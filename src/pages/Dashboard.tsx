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
  Users,
  ChevronDown,
  ChevronUp,
  List
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
const quarters = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
const years = ["2023", "2024", "2025"];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Logic States
  const [timeframeType, setTimeframeType] = useState<string>("monthly"); 
  const [selectedSubValue, setSelectedSubValue] = useState<string>("April"); 

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

  // Reset sub-value when type changes to ensure valid selection
  const handleTypeChange = (val: string) => {
    setTimeframeType(val);
    if (val === "monthly") setSelectedSubValue("January");
    if (val === "quarterly") setSelectedSubValue("Q1 (Jan-Mar)");
    if (val === "annually") setSelectedSubValue("2025");
  };

  const currentRevenue = useMemo(() => {
    const filteredByRange = mockBookings.filter((booking) => {
      const bookingDate = new Date(booking.travelDate);
      const bMonth = bookingDate.getMonth();
      const bYear = bookingDate.getFullYear().toString();

      if (timeframeType === "monthly") {
        return months[bMonth] === selectedSubValue;
      } 
      
      if (timeframeType === "quarterly") {
        const qIndex = quarters.indexOf(selectedSubValue);
        const bookingQ = Math.floor(bMonth / 3);
        return bookingQ === qIndex;
      } 
      
      if (timeframeType === "annually") {
        return bYear === selectedSubValue;
      }
      
      return true;
    });

    return filteredByRange.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [timeframeType, selectedSubValue]);

  // --- TOURIST TRAFFIC DATA ---
  const touristTrafficData = useMemo(() => {
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <Card className="lg:col-span-2 bg-white shadow-sm border-l-4 border-l-green-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
                <CardDescription>Filter by period</CardDescription>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <JapaneseYen className="w-6 h-6 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Timeframe</label>
                  <select 
                    value={timeframeType} 
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="text-sm border rounded-md p-2 bg-gray-50 min-w-[140px]"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    {timeframeType === "monthly" ? "Select Month" : timeframeType === "quarterly" ? "Select Quarter" : "Select Year"}
                  </label>
                  <select 
                    value={selectedSubValue} 
                    onChange={(e) => setSelectedSubValue(e.target.value)}
                    className="text-sm border rounded-md p-2 bg-gray-50 min-w-[140px]"
                  >
                    {timeframeType === "monthly" && months.map(m => <option key={m} value={m}>{m}</option>)}
                    {timeframeType === "quarterly" && quarters.map(q => <option key={q} value={q}>{q}</option>)}
                    {timeframeType === "annually" && years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-gray-900">
                    ¥{currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-100">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-600">Verified Income</span>
                </div>
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
                </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tourist Traffic Trends
                </CardTitle>
                <CardDescription>Number of travelers per month</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={touristTrafficData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="travelers" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: "#2563EB" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

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
                            <span className="font-medium text-gray-900 block">Travel Date</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {booking.travelDate}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-900 block">Total</span>
                            <span className="font-bold text-red-600">
                                ¥{booking.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
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