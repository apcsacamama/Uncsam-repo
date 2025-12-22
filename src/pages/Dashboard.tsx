import Navigation from "../components/Navigation";
import FAQChatbot from "../components/FAQChatbot";
import { supabase } from "../lib/supabaseClient"; // Ensure this path matches your file
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { mockBookings, dashboardStats } from "../data/offers";
import { useState, useMemo, useEffect } from "react";
import {
  Users,
  DollarSign,
  Search,
  Eye,
  Edit,
  Plus,
  TrendingUp,
  MapPin,
  X,
  Save,
  Package,
  Loader2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  // --- SUPABASE STATE ---
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- EDITING STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: 0, description: "" });

  // 1. Fetch Packages from Supabase on Load
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Revenue Calculation
  const currentRevenue = useMemo(() => {
    const filteredByMonth = mockBookings.filter((booking) => {
      if (selectedMonth === "all") return true;
      const bookingDate = new Date(booking.travelDate);
      const bookingMonth = bookingDate.toLocaleString('default', { month: 'long' });
      return bookingMonth === selectedMonth;
    });
    return filteredByMonth.reduce((acc, curr) => acc + curr.totalPrice, 0);
  }, [selectedMonth]);

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

  // 3. Handle Edit Start
  const startEditing = (pkg: any) => {
    setEditingPackageId(pkg.id);
    setEditForm({ title: pkg.title, price: pkg.price, description: pkg.description || "" });
    setIsEditModalOpen(true);
  };

  // 4. Save to Supabase
  const savePackage = async () => {
    if (!editingPackageId) return;

    try {
      const { error } = await supabase
        .from('tour_packages')
        .update({
          title: editForm.title,
          price: editForm.price,
          description: editForm.description
        })
        .eq('id', editingPackageId);

      if (error) throw error;

      // Update local state instantly
      setPackages(packages.map(p => 
        p.id === editingPackageId 
          ? { ...p, title: editForm.title, price: editForm.price, description: editForm.description }
          : p
      ));

      setEditingPackageId(null);
      setIsEditModalOpen(false); // Close modal if you want, or keep it open for list view
      alert("Package updated successfully!");

    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update package.");
    }
  };

  // Chart Data
  const bookingStatusData = [
    { name: "Pending", bookings: dashboardStats.pendingBookings, fill: "#EAB308" },
    { name: "Completed", bookings: dashboardStats.completedBookings, fill: "#22C55E" },
  ];
  const destinationData = [
    { name: "Nagoya", value: 45 },
    { name: "Tokyo", value: 32 },
    { name: "Hiroshima", value: 28 },
    { name: "Kyoto", value: 15 },
  ];
  const COLORS = ["#DC2626", "#2563EB", "#16A34A", "#9333EA"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your travel bookings and offers</p>
            </div>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Offer
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1 bg-gradient-to-br from-white to-gray-50 border-l-4 border-l-green-500 relative overflow-visible">
            <CardContent className="p-6 flex flex-col justify-center h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Revenue</p>
                  <div className="relative">
                    <select 
                      value={selectedMonth} 
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="text-sm font-medium border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                    >
                      <option value="all">All Time</option>
                      {months.map((month) => (
                        <option key={month} value={month}>{month}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div>
                <p className="text-4xl font-extrabold text-gray-900">¥{currentRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-500 font-medium">+8%</span>
                  <span className="text-gray-500 ml-1">{selectedMonth === 'all' ? 'total growth' : `vs last ${selectedMonth}`}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Booking Status Overview</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bookingStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#4B5563', fontSize: 14 }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="bookings" radius={[0, 4, 4, 0]} barSize={40} label={{ position: 'right', fill: '#6B7280', fontSize: 12 }}>
                      {bookingStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Search bookings..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{booking.customerName}</h4>
                          <p className="text-sm text-gray-600">{booking.email}</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Package:</span>
                          {/* We try to find package title from our DB packages first, fallback to mock */}
                          <p>{packages.find((p) => p.id === booking.packageId)?.title || "Unknown Package"}</p>
                        </div>
                        <div><span className="font-medium">Travel Date:</span><p>{booking.travelDate}</p></div>
                        <div><span className="font-medium">Travelers:</span><p>{booking.travelers} people</p></div>
                        <div><span className="font-medium">Total:</span><p className="font-bold text-red-600">¥{booking.totalPrice.toLocaleString()}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline"><Eye className="w-4 h-4 mr-1" />View</Button>
                        <Button size="sm" variant="outline"><Edit className="w-4 h-4 mr-1" />Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Analytics */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline"><Plus className="w-4 h-4 mr-2" />Add New Destination</Button>
                
                {/* Edit Button Triggers Modal */}
                <Button 
                  className="w-full justify-start hover:bg-red-50 hover:text-red-600 hover:border-red-200" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tour Packages
                </Button>
                
                <Button className="w-full justify-start" variant="outline"><Users className="w-4 h-4 mr-2" />Customer Management</Button>
                <Button className="w-full justify-start" variant="outline"><TrendingUp className="w-4 h-4 mr-2" />View Analytics</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Popular Destinations</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={destinationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {destinationData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center text-sm text-gray-500 mt-2"><MapPin className="w-3 h-3 inline mr-1" />Based on recent bookings</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <FAQChatbot />

      {/* --- EDIT PACKAGES MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50">
              <CardTitle>Manage Tour Packages</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => { setIsEditModalOpen(false); setEditingPackageId(null); }}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="overflow-y-auto p-0 flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                </div>
              ) : editingPackageId ? (
                <div className="p-6 space-y-4">
                   <div className="flex items-center justify-between mb-2">
                     <h3 className="text-lg font-semibold text-gray-700">Editing Package</h3>
                     <Button variant="ghost" size="sm" onClick={() => setEditingPackageId(null)}>Back to List</Button>
                   </div>
                   
                   <div className="space-y-3">
                     <div>
                       <label className="text-sm font-medium text-gray-700">Package Title</label>
                       <Input 
                          value={editForm.title} 
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})} 
                          className="mt-1"
                        />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-700">Price (¥)</label>
                       <Input 
                          type="number"
                          value={editForm.price} 
                          onChange={(e) => setEditForm({...editForm, price: parseInt(e.target.value)})} 
                          className="mt-1"
                        />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-gray-700">Description</label>
                       <textarea 
                          className="w-full min-h-[100px] mt-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={editForm.description}
                          onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                       />
                     </div>
                   </div>

                   <Button onClick={savePackage} className="w-full bg-green-600 hover:bg-green-700 mt-4">
                     <Save className="w-4 h-4 mr-2" /> Save Changes
                   </Button>
                </div>
              ) : (
                /* List View of Packages */
                <div className="divide-y">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                         <div className="bg-blue-100 p-2 rounded-lg mt-1">
                           <Package className="w-5 h-5 text-blue-600" />
                         </div>
                         <div>
                           <h4 className="font-semibold text-gray-900">{pkg.title}</h4>
                           <p className="text-sm text-gray-500 line-clamp-1">{pkg.description}</p>
                           <p className="text-sm font-bold text-green-600 mt-1">¥{pkg.price.toLocaleString()}</p>
                         </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => startEditing(pkg)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </Button>
                    </div>
                  ))}
                  {packages.length === 0 && (
                     <div className="p-8 text-center text-gray-500">
                        No packages found in Supabase.
                     </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}