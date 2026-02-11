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
import { mockBookings, tourPackages } from "../data/offers";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { TourPackage } from "../types/travel";
import OfferModal from "../components/OfferModal"; // Added Import
import {
  User,
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
  AlertCircle 
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // --- New State for Dynamic Favorites ---
  const [favorites, setFavorites] = useState<TourPackage[]>([]);

  // --- Modal Logic States ---
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching user...");

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log("No user found, redirecting...");
          navigate("/signin");
          return;
        }

        const { data: profile, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (dbError) {
          console.warn("Database error (Profile might not exist yet):", dbError.message);
        }

        setUserInfo({
          name: profile?.full_name || user.user_metadata?.full_name || "Traveler",
          email: user.email || "", 
          phone: profile?.phone || user.user_metadata?.phone || "",
          dateOfBirth: "1990-01-01", 
          address: "Tokyo, Japan",   
          preferences: "Culture, Food", 
          avatar_url: profile?.avatar_url || "",
          role: profile?.role || "customer"
        });

      } catch (error: any) {
        console.error("Critical Error:", error);
        setErrorMsg(error.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    // --- FAVORITES SYNC LOGIC ---
    const loadFavorites = () => {
      const saved = JSON.parse(localStorage.getItem("tour_favorites") || "[]");
      setFavorites(saved);
    };

    loadFavorites();
    window.addEventListener("favoritesUpdated", loadFavorites);
    return () => window.removeEventListener("favoritesUpdated", loadFavorites);
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/signin");
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name && name.length > 0 ? name.charAt(0).toUpperCase() : "U";
  };

  const userBookings = mockBookings.filter((b) => b.userId === "user-001");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const favoriteDestinations = ["Nagoya Castle", "Tokyo Disneyland", "Kyoto Temples", "Osaka Castle"];

  // Helper to remove favorite directly from Profile
  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id);
    localStorage.setItem("tour_favorites", JSON.stringify(updated));
    setFavorites(updated);
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  // --- Modal Trigger Handler ---
  const handleViewTour = (tour: TourPackage) => {
    setSelectedTour(tour);
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <span className="ml-2 text-gray-600">Loading Profile...</span>
        </div>
    );
  }

  if (errorMsg) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-gray-600 mb-4">{errorMsg}</p>
                <Button onClick={() => navigate('/signin')}>Back to Login</Button>
            </div>
        </div>
    );
  }

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
                <h1 className="text-3xl font-bold text-gray-900">
                  {userInfo.name}
                </h1>
                <p className="text-gray-600 flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-2" />
                  {userInfo.email}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline">{userInfo.role === 'admin' ? 'Administrator' : 'Traveler'}</Badge>
                  <span className="text-sm text-gray-600">
                    {userBookings.length} trips completed
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
                <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>

                <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="flex items-center gap-2"
                >
                <Edit3 className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
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
              <CardHeader>
                <CardTitle>Booking History</CardTitle>
                <p className="text-sm text-gray-600">
                  View and manage all your travel bookings
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {userBookings.length > 0 ? userBookings.map((booking) => {
                    const packageInfo = tourPackages.find(
                      (p) => p.id === booking.packageId,
                    );
                    return (
                      <div
                        key={booking.id}
                        className="border rounded-lg p-6 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {packageInfo?.title || "Unknown Package"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Booking ID: {booking.id}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4 text-sm mb-4">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium">Travel Date</p>
                              <p>{booking.travelDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium">Travelers</p>
                              <p>{booking.travelers} people</p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Star className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium">Total Paid</p>
                              <p className="font-bold text-red-600">
                                ¥{booking.totalPrice.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                              <p className="font-medium">Booked On</p>
                              <p>{booking.createdAt}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download Receipt
                          </Button>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-500">
                        No bookings found. Time to plan a trip!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage your account details and preferences
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userInfo.name}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, name: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userInfo.email}
                        disabled={true} 
                        className="bg-gray-100 text-gray-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={userInfo.phone}
                        onChange={(e) =>
                          setUserInfo({ ...userInfo, phone: e.target.value })
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end mt-6">
                    <Button
                      onClick={handleSave}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Favorite Destinations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favoriteDestinations.map((destination, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-red-600 mr-3" />
                          <span>{destination}</span>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Heart className="w-4 h-4 text-red-600 fill-current" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Saved Packages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favorites.length > 0 ? favorites.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{pkg.title}</p>
                          <p className="text-sm text-gray-600">
                            ¥{pkg.price.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => removeFavorite(pkg.id)}
                            >
                              <Heart className="w-4 h-4 text-red-600 fill-current" />
                            </Button>
                            {/* Updated View Button Trigger */}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewTour(pkg)}
                            >
                              View
                            </Button>
                        </div>
                      </div>
                    )) : (
                        <div className="text-center py-6 text-sm text-gray-500">
                            No saved packages yet.
                        </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Account Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Email Notifications
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-gray-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* RENDER THE MODAL AT THE BOTTOM */}
      <OfferModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        offer={selectedTour}
      />
    </div>
  );
}