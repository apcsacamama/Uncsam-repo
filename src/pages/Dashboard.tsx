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


// --- REALISTIC MERGED DATA ---
const mockBookings = [
  // 2023: Startup
  { id: 101, customerName: "Early Group", email: "g1@ex.com", status: "completed", packageId: 1, travelDate: "2023-04-10", travelers: 4, totalPrice: 450000 },
  { id: 102, customerName: "Family Trip", email: "f1@ex.com", status: "completed", packageId: 2, travelDate: "2023-10-15", travelers: 5, totalPrice: 750000 },

  // 2024: Growth Phase
  { id: 201, customerName: "Winter Tour", email: "w1@ex.com", status: "completed", packageId: 2, travelDate: "2024-01-20", travelers: 4, totalPrice: 600000 },
  { id: 202, customerName: "Cherry Group", email: "c1@ex.com", status: "completed", packageId: 1, travelDate: "2024-03-25", travelers: 6, totalPrice: 720000 },
  { id: 203, customerName: "Summer Solstice", email: "s1@ex.com", status: "completed", packageId: 3, travelDate: "2024-07-10", travelers: 8, totalPrice: 950000 },
  { id: 204, customerName: "Autumn Leaves", email: "a1@ex.com", status: "completed", packageId: 2, travelDate: "2024-11-05", travelers: 7, totalPrice: 980000 },

  // 2025: High Volume (Synced Monthly Activity)
  { id: 1, customerName: "New Year Group", email: "ny@ex.com", status: "completed", packageId: 1, travelDate: "2025-01-05", travelers: 4, totalPrice: 450000 },
  { id: 2, customerName: "Feb Skiers", email: "feb@ex.com", status: "completed", packageId: 2, travelDate: "2025-02-14", travelers: 3, totalPrice: 380000 },
  { id: 3, customerName: "March Madness", email: "grad@ex.com", status: "completed", packageId: 1, travelDate: "2025-03-20", travelers: 6, totalPrice: 720000 },
  { id: 4, customerName: "Alice Johnson", email: "alice@example.com", status: "confirmed", packageId: 1, travelDate: "2025-04-10", travelers: 8, totalPrice: 850000 },
  { id: 5, customerName: "Charlie Brown", email: "charlie@example.com", status: "confirmed", packageId: 3, travelDate: "2025-05-20", travelers: 5, totalPrice: 550000 },
  { id: 6, customerName: "Diana Prince", email: "diana@example.com", status: "pending", packageId: 1, travelDate: "2025-06-01", travelers: 4, totalPrice: 420000 },
  { id: 7, customerName: "Summer Peak", email: "sum@ex.com", status: "confirmed", packageId: 2, travelDate: "2025-07-15", travelers: 6, totalPrice: 680000 },
  { id: 8, customerName: "Fiona Gallagher", email: "fiona@example.com", status: "confirmed", packageId: 3, travelDate: "2025-08-15", travelers: 4, totalPrice: 450000 },
  { id: 9, customerName: "Sept Explorers", email: "sep@ex.com", status: "pending", packageId: 1, travelDate: "2025-09-10", travelers: 3, totalPrice: 320000 },
  { id: 10, customerName: "Momiji Group", email: "mom@ex.com", status: "confirmed", packageId: 2, travelDate: "2025-10-25", travelers: 8, totalPrice: 820000 },
  { id: 11, customerName: "Culture Tour", email: "cult@ex.com", status: "confirmed", packageId: 3, travelDate: "2025-11-12", travelers: 4, totalPrice: 410000 },
  { id: 12, customerName: "Year End Bash", email: "bash@ex.com", status: "pending", packageId: 1, travelDate: "2025-12-28", travelers: 5, totalPrice: 480000 },
];

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const quarters = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
const years = ["2023", "2024", "2025"];

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [timeframeType, setTimeframeType] = useState<string>("annually"); 
  const [selectedSubValue, setSelectedSubValue] = useState<string>("2025"); 

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

  const handleTypeChange = (val: string) => {
    setTimeframeType(val);
    if (val === "monthly") setSelectedSubValue("April");
    if (val === "quarterly") setSelectedSubValue("Q2 (Apr-Jun)");
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

  const touristTrafficData = useMemo(() => {
    const data = months.map(m => ({ name: m.substring(0, 3), travelers: 0 }));
    let activeYear = timeframeType === "annually" ? selectedSubValue : "2025";

    mockBookings.forEach(booking => {
      const date = new Date(booking.travelDate);
      if (date.getFullYear().toString() === activeYear) {
        const monthIndex = date.getMonth();
        data[monthIndex].travelers += booking.travelers;
      }
    });
    return data;
  }, [timeframeType, selectedSubValue]);

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
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hi UncleSam!</h1>
                <p className="text-gray-500 font-medium">Monitoring growth across 10,000+ followers</p>
            </div>
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-bold">10K Community</span>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-white shadow-sm border-l-4 border-l-green-500 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium text-gray-700">Total Revenue</CardTitle>
                <CardDescription>Select period to view income</CardDescription>
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
                    className="text-sm border-b-2 border-gray-200 py-1 bg-transparent focus:border-green-500 outline-none font-semibold transition-all"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Selection</label>
                  <select 
                    value={selectedSubValue} 
                    onChange={(e) => setSelectedSubValue(e.target.value)}
                    className="text-sm border-b-2 border-gray-200 py-1 bg-transparent focus:border-green-500 outline-none font-semibold transition-all"
                  >
                    {timeframeType === "monthly" && months.map(m => <option key={m} value={m}>{m}</option>)}
                    {timeframeType === "quarterly" && quarters.map(q => <option key={q} value={q}>{q}</option>)}
                    {timeframeType === "annually" && years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-6xl font-black text-gray-900 tracking-tighter">
                    ¥{currentRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 rounded-full text-green-700 border border-green-200 shadow-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Growth Mode</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 shadow-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Top Destinations</CardTitle>
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

        {/* --- DYNAMIC TRAFFIC TRENDS --- */}
        <Card className="shadow-sm border-t-4 border-t-blue-500">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tourist Traffic Trend: {timeframeType === "annually" ? selectedSubValue : "2025 Peak Year"}
                </CardTitle>
                <CardDescription>Visualizing traveler volume from Facebook bookings</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={touristTrafficData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                            {/* FIX: Set a fixed domain so the graph scale doesn't change between years */}
                            <YAxis 
                                domain={[0, 15]} 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#888', fontSize: 12}} 
                            />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
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

        <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Sales Activity</CardTitle>
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
                    {filteredBookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="font-bold text-gray-900">{booking.customerName}</h4>
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
                            <span className="font-bold text-blue-700">
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