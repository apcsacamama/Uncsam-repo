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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { TourPackage } from "../types/travel";
import OfferModal from "../components/OfferModal"; 
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
  Info,
  Users,
  CheckCircle2
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // --- State for Live Data ---
  const [favorites, setFavorites] = useState<TourPackage[]>([]);
  const [liveBookings, setLiveBookings] = useState<any[]>([]);
  const [allDestinations, setAllDestinations] = useState<any[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    preferences: "",
    role: "customer"
  });

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          navigate("/signin");
          return;
        }

        // 1. Fetch User Profile
        const { data: profile } = await supabase
          .from('user')
          .select('*')
          .eq('id', user.id)
          .single();

        // 2. Fetch Live Bookings
        const { data: bookings } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        // 3. Fetch Destination Reference (to map names in Details)
        const { data: dests } = await supabase
          .from('tour_destinations')
          .select('*');

        if (bookings) setLiveBookings(bookings);
        if (dests) setAllDestinations(dests);

        setUserInfo({
          name: profile?.full_name || user.user_metadata?.full_name || "Traveler",
          email: user.email || "", 
          phone: profile?.phone || "",
          address: profile?.address || "Not set",   
          preferences: profile?.preferences || "None set", 
          role: profile?.role || "customer"
        });

      } catch (error: any) {
        console.error("Profile load error:", error);
        setErrorMsg("Failed to load profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Favorites Sync Logic
    const loadFavorites = () => {
      const saved = JSON.parse(localStorage.getItem("tour_favorites") || "[]");
      setFavorites(saved);
    };

    loadFavorites();
    window.addEventListener("favoritesUpdated", loadFavorites);
    return () => window.removeEventListener("favoritesUpdated", loadFavorites);
  }, [navigate]);

  // --- Helper: Map IDs to Destination Names ---
  const getDestinationNames = (destIds: any) => {
    if (!destIds) return ["Standard Itinerary"];
    
    // Handle both array of IDs and single ID string
    const ids = Array.isArray(destIds) ? destIds : [destIds];
    return ids.map(id => {
      const found = allDestinations.find(d => d.id === id);
      return found ? found.name : id;
    });
  };

  const handleDownloadReceipt = (booking: any) => {
    alert(`Generating receipt for Booking #${booking.booking_id}...`);
  };

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
      alert("Error saving profile: " + error.message);
    }
  };

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    localStorage.setItem("tour_favorites", JSON.stringify(updated));
    setFavorites(updated);
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const handleViewTour = (tour: TourPackage) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  const favoriteDestinations = ["Nagoya Castle", "Tokyo Disneyland", "Kyoto Temples", "Osaka Castle"];

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-red-600 w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="bg-red-600 rounded-full w-20 h-20 flex items-center justify-center text-white text-3xl font-bold uppercase shadow-lg">
              {userInfo.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{userInfo.name}</h1>
              <p className="text-gray-500 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {userInfo.email}
              </p>
              <Badge variant="outline" className="mt-2 capitalize">{userInfo.role}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 shadow-sm">
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="profile">Profile Info</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* --- BOOKINGS TAB --- */}
          <TabsContent value="bookings" className="space-y-4">
            {liveBookings.length > 0 ? liveBookings.map((booking) => (
              <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge className="mb-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-none capitalize">
                        {booking.status || "Paid"}
                      </Badge>
                      <h3 className="text-xl font-bold uppercase tracking-tight">
                        Itinerary #{booking.itinerary_id || "Custom Build"}
                      </h3>
                      <p className="text-sm text-gray-400 font-mono mt-1">Booking ID: {booking.booking_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">¥{Number(booking.total_price).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Confirmed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-gray-100 p-2 rounded-full"><Calendar className="w-4 h-4 text-gray-600" /></div>
                      <div><p className="text-gray-500 font-medium">Travel Date</p><p className="font-bold text-gray-900">{booking.travel_date}</p></div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="bg-gray-100 p-2 rounded-full"><Users className="w-4 h-4 text-gray-600" /></div>
                      <div><p className="text-gray-500 font-medium">Group Size</p><p className="font-bold text-gray-900">{booking.pax_count} Travelers</p></div>
                    </div>
                  </div>

                  <div className="flex gap-3 border-t pt-5">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 hover:bg-gray-50">
                          <Eye className="w-4 h-4" /> View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5 text-blue-600" /> Full Booking Overview
                          </DialogTitle>
                          <DialogDescription>Detailed itinerary and destination breakdown.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                          <div className="bg-gray-50 p-5 rounded-xl space-y-4 border">
                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-600" /> Planned Itinerary
                            </h4>
                            <ul className="space-y-2">
                              {getDestinationNames(booking.destinations).map((name, i) => (
                                <li key={i} className="text-sm flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
                                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                                  <span className="font-medium text-gray-700">{name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wider">Included in your package</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="px-3 py-1">Private Van Transfer</Badge>
                              <Badge variant="secondary" className="px-3 py-1">Professional English Driver</Badge>
                              <Badge variant="secondary" className="px-3 py-1">Fuel & Toll Fees</Badge>
                              <Badge variant="secondary" className="px-3 py-1">Hotel Pickup</Badge>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg text-xs text-blue-800 border border-blue-100 flex gap-3">
                            <Info className="w-5 h-5 shrink-0 text-blue-600" />
                            <p className="leading-relaxed font-medium">
                              Your driver will reach out to you via email or phone 24 hours before departure to coordinate the exact pickup time and location.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(booking)} className="hover:bg-gray-50">
                      <Download className="w-4 h-4 mr-2" /> Download Receipt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="text-center py-24 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <Calendar className="mx-auto w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">No trips booked yet</h3>
                <p className="text-gray-500 mb-6">Explore our tour packages and start your Japan adventure.</p>
                <Button onClick={() => navigate('/offers')} className="bg-red-600 hover:bg-red-700">Explore Packages</Button>
              </div>
            )}
          </TabsContent>

          {/* --- PROFILE INFO TAB --- */}
          <TabsContent value="profile">
            <Card className="shadow-sm">
              <CardHeader><CardTitle>Account Information</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Full Name</Label>
                      <Input disabled={!isEditing} value={userInfo.name} onChange={e => setUserInfo({...userInfo, name: e.target.value})} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Phone Number</Label>
                      <Input disabled={!isEditing} value={userInfo.phone} onChange={e => setUserInfo({...userInfo, phone: e.target.value})} className="bg-white" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Current Address</Label>
                      <Input disabled={!isEditing} value={userInfo.address} onChange={e => setUserInfo({...userInfo, address: e.target.value})} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-gray-500">Travel Preferences</Label>
                      <Input disabled={!isEditing} value={userInfo.preferences} onChange={e => setUserInfo({...userInfo, preferences: e.target.value})} className="bg-white" />
                    </div>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 shadow-lg px-8">
                        <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- FAVORITES TAB --- */}
          <TabsContent value="favorites" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-600" /> Saved Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favoriteDestinations.map((dest, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow">
                        <div className="flex items-center"><MapPin className="w-4 h-4 text-red-600 mr-3" /> <span className="font-bold text-gray-700">{dest}</span></div>
                        <Button size="sm" variant="ghost" className="hover:bg-red-50 text-red-600"><Heart className="fill-current w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Saved Packages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favorites.length > 0 ? favorites.map((pkg) => (
                      <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:shadow-sm transition-shadow">
                        <div>
                          <p className="font-bold text-gray-900">{pkg.title}</p>
                          <p className="text-sm text-red-600 font-bold">¥{pkg.price.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => removeFavorite(pkg.id)} className="text-gray-400 hover:text-red-600"><Heart className="fill-current w-4 h-4" /></Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewTour(pkg)} className="font-bold border-2">Book Again</Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 text-gray-400 italic text-sm">No saved tour packages found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* --- SETTINGS TAB --- */}
          <TabsContent value="settings">
            <Card className="max-w-md shadow-sm">
              <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-gray-600" /> Account Security</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start font-medium">Change Account Password</Button>
                <Button variant="outline" className="w-full justify-start font-medium">Notification Preferences</Button>
                <Button variant="outline" className="w-full justify-start font-bold text-red-600 border-red-600 hover:bg-red-50" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out from Device
                </Button>
                <Button variant="ghost" className="w-full justify-start text-xs text-gray-400 hover:text-red-500">Request Account Deletion</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <OfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} offer={selectedTour} />
    </div>
  );
}