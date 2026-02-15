import Navigation from "../components/Navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
// Added Dialog imports for the "Details" popup
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { tourPackages } from "../data/offers"; 
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Save,
  Eye,
  Download,
  Star,
  Heart,
  Settings,
  LogOut,
  Loader2,
  AlertCircle,
  Info 
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    preferences: "",
    avatar_url: "",
    role: "customer"
  });

  const [liveBookings, setLiveBookings] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate("/signin");
          return;
        }

        const { data: profile } = await supabase
          .from('user')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fetching live bookings - ensure travel_date is included in your SELECT
        const { data: bookings, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id);

        if (!bookingError) setLiveBookings(bookings || []);

        setUserInfo({
          name: profile?.full_name || user.user_metadata?.full_name || "Traveler",
          email: user.email || "", 
          phone: profile?.phone || user.user_metadata?.phone || "",
          dateOfBirth: profile?.dob || "1990-01-01", 
          address: profile?.address || "Not set",   
          preferences: profile?.preferences || "None set", 
          avatar_url: profile?.avatar_url || "",
          role: profile?.role || "customer"
        });

      } catch (error: any) {
        setErrorMsg(error.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user')
        .update({
          full_name: userInfo.name,
          phone: userInfo.phone,
          address: userInfo.address,
          preferences: userInfo.preferences
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
    } catch (error: any) {
      alert("Error saving: " + error.message);
    }
  };

  const getInitials = (name: string) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const favoriteDestinations = ["Nagoya Castle", "Tokyo Disneyland", "Kyoto Temples", "Osaka Castle"];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex items-center space-x-6">
              <div className="bg-red-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-2xl font-bold uppercase">
                {getInitials(userInfo.name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{userInfo.name}</h1>
                <p className="text-gray-600 flex items-center mt-1"><Mail className="w-4 h-4 mr-2" /> {userInfo.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="capitalize">{userInfo.role}</Badge>
                  <span className="text-sm text-gray-600">{liveBookings.length} trips total</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
                <Button variant="ghost" onClick={handleSignOut} className="text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4 mr-2" /> Sign Out</Button>
                <Button onClick={() => setIsEditing(!isEditing)} variant="outline"><Edit3 className="w-4 h-4 mr-2" /> {isEditing ? "Cancel" : "Edit Profile"}</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Booking History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {liveBookings.length > 0 ? liveBookings.map((booking) => {
                    return (
                      <div key={booking.booking_id} className="border rounded-lg p-6 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">Itinerary #{booking.itinerary_id || "Custom"}</h3>
                            <p className="text-sm text-gray-600">Booking ID: {booking.booking_id}</p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                          {/* FIX: Using travel_date column here */}
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" /> {booking.travel_date || "Date Pending"}
                          </div>
                          <div className="flex items-center text-gray-600"><MapPin className="w-4 h-4 mr-2" /> {booking.pax_count} Travelers</div>
                          <div className="flex items-center font-bold text-red-600">¥{Number(booking.total_price).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          {/* Details Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" /> Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Info className="w-5 h-5 text-blue-600" /> Booking Details
                                </DialogTitle>
                                <DialogDescription>
                                  Detailed information for Itinerary #{booking.itinerary_id}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 font-medium">Travel Date</p>
                                    <p className="text-base font-semibold">{booking.travel_date}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 font-medium">Pax Count</p>
                                    <p className="text-base font-semibold">{booking.pax_count} Travelers</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 font-medium">Booking ID</p>
                                    <p className="text-base font-semibold">{booking.booking_id}</p>
                                  </div>
                                  <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500 font-medium">Total Paid</p>
                                    <p className="text-base font-bold text-green-700">¥{Number(booking.total_price).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2">Booking Status</h4>
                                  <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                                  <p className="text-xs text-gray-500 mt-2 italic">
                                    Note: Your professional driver will contact you 24 hours before your travel date.
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Button size="sm" variant="outline"><Download className="w-4 h-4 mr-1" /> Receipt</Button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-500">No live bookings found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input disabled={!isEditing} value={userInfo.name} onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input disabled={!isEditing} value={userInfo.phone} onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input disabled={!isEditing} value={userInfo.address} onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferences</Label>
                    <Input disabled={!isEditing} value={userInfo.preferences} onChange={(e) => setUserInfo({ ...userInfo, preferences: e.target.value })} />
                  </div>
                </div>
                {isEditing && (
                  <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 mt-4"><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="text-red-600" /> Favorite Destinations</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {favoriteDestinations.map((dest, i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                      <div className="flex items-center"><MapPin className="w-4 h-4 text-red-600 mr-3" /> {dest}</div>
                      <Button size="sm" variant="ghost"><Heart className="text-red-600 fill-current w-4" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader><CardTitle><Settings className="inline w-5 h-5 mr-2" /> Account Settings</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">Change Password</Button>
                <Button variant="outline" className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50" onClick={handleSignOut}>Sign Out</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}