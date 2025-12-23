import Navigation from "../components/Navigation";
import ItineraryChatbot from "../components/ItineraryChatbot";
import InvoiceModal from "../components/ReceiptModal"; // <--- 1. Import InvoiceModal
import { supabase } from "../lib/supabaseClient"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  CheckCircle,
  Calendar,
  Users,
  MapPin,
  Phone,
  Mail,
  Download,
  Share,
  Sparkles,
  Plane,
  Loader2
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

const TIERED_PRICING: Record<string, { tier1: number; tier2: number }> = {
  "nara-tour": { tier1: 85000, tier2: 105000 },
  "tokyo-disney": { tier1: 60000, tier2: 80000 },
};
const FIXED_PRICE_IDS = ["fukuoka-tour", "fukui-tour", "hiroshima-tour"];

const STANDARD_INCLUSIONS = [
  "12-Hour Private Tour",
  "Professional Driver",
  "Hotel Pick-up & Drop-off",
  "Gas & Tolls Included",
  "Private Van Transportation"
];

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  
  const packageId = searchParams.get("package");
  const travelersParam = searchParams.get("travelers") || "1";
  const travelers = parseInt(travelersParam);
  const isCustom = searchParams.get("custom") === "true";
  const urlPrice = searchParams.get("price");
  const travelDateParam = searchParams.get("date");
  const locationParam = searchParams.get("location");
  const addonsParam = searchParams.get("addons"); 
  const hasAirportTransfer = addonsParam && addonsParam.includes("airport-transfer");

  const customerName = searchParams.get("name") || "Valued Customer";
  const customerEmail = searchParams.get("email") || "email@example.com";
  const customerPhone = searchParams.get("phone") || "N/A";

  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);
  // 2. Add state to control Invoice Modal visibility
  const [showInvoice, setShowInvoice] = useState(false);
  
  const [bookingId] = useState(`BK${Date.now()}`);

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isCustom);

  // --- FETCH FROM DB ---
  useEffect(() => {
    if (packageId && !isCustom) {
      fetchPackage();
    }
  }, [packageId, isCustom]);

  const fetchPackage = async () => {
    try {
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .or(`id.eq.${packageId},slug.eq.${packageId}`) 
        .single();
      
      if (error) {
         const { data: slugData, error: slugError } = await supabase
            .from('tour_packages')
            .select('*')
            .eq('slug', packageId)
            .single();
            
         if (slugError) throw slugError;
         setSelectedPackage(slugData);
      } else {
         setSelectedPackage(data);
      }
    } catch (error) {
      console.error("Error fetching package details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayInclusions = selectedPackage 
    ? selectedPackage.inclusions || STANDARD_INCLUSIONS 
    : STANDARD_INCLUSIONS;

  const displayDestinations = useMemo(() => {
    if (selectedPackage && selectedPackage.destinations) {
        return selectedPackage.destinations;
    }
    
    if (locationParam === "nara") return ["Todai-ji Temple", "Nara Park", "Kasuga Taisha", "Local Spot"];
    if (locationParam === "hakone") return ["Lake Ashi", "Hakone Shrine", "Owakudani", "Open Air Museum"];
    if (locationParam === "nagoya") return ["Nagoya Castle", "Oasis 21", "Toyota Museum", "Osu Kannon"];
    
    return ["Custom Itinerary Point 1", "Custom Itinerary Point 2", "Custom Itinerary Point 3"];
  }, [selectedPackage, locationParam]);

  let totalPrice = 0;

  if (urlPrice) {
    totalPrice = parseInt(urlPrice);
  } else if (selectedPackage) {
    const identifier = selectedPackage.slug || selectedPackage.id;

    if (TIERED_PRICING[identifier]) {
      const config = TIERED_PRICING[identifier];
      totalPrice = travelers <= 6 ? config.tier1 : config.tier2;
    } else if (FIXED_PRICE_IDS.includes(identifier)) {
      totalPrice = selectedPackage.price;
    } else {
      totalPrice = selectedPackage.price * travelers; 
    }
  }

  const bookingDetails = {
    id: bookingId,
    customerName,
    email: customerEmail,
    phone: customerPhone,
    travelDate: travelDateParam || "Date not selected", 
    status: "confirmed" as const,
    createdAt: new Date().toISOString().split("T")[0], 
  };

  const driverDetails = {
    name: "Takeshi Yamamoto",
    phone: "+81 80-5331-1738",
    languages: ["English", "Japanese", "Tagalog"],
    vehicleType: "Private Van",
    licenseNumber: "JP-2024-001",
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-3">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-green-100">
            Thank you for your booking. Your Japanese adventure awaits!
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">Booking ID</h3>
                    <p className="text-gray-600">{bookingDetails.id}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {bookingDetails.status}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Package</h4>
                    <p className="text-gray-600">
                      {isCustom
                        ? `Custom Tour (${locationParam ? locationParam.toUpperCase() : "Japan"})`
                        : selectedPackage?.title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Travel Date
                    </h4>
                    <p className="text-gray-600 font-semibold text-red-600">
                        {bookingDetails.travelDate}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Travelers
                    </h4>
                    <p className="text-gray-600">
                      {travelers} {travelers === 1 ? "person" : "people"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Booking Date
                    </h4>
                    <p className="text-gray-600">{bookingDetails.createdAt}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    {isCustom ? "Planned Destinations (Custom)" : "Included Destinations"}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {displayDestinations?.map(
                      (destination: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center text-sm text-gray-600"
                        >
                          <MapPin className="w-3 h-3 mr-2 text-red-600" />
                          {destination}
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Inclusions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {displayInclusions.map((inclusion: string, index: number) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                        {inclusion}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Your Assigned Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-600 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold text-lg">
                      {driverDetails.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">
                        {driverDetails.name}
                      </h3>
                      <p className="text-green-700 text-sm">
                        Professional Tour Driver
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">
                        Contact Number
                      </h4>
                      <p className="text-green-800 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {driverDetails.phone}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-1">
                        Vehicle
                      </h4>
                      <p className="text-green-800">
                        {driverDetails.vehicleType}
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-medium text-green-900 mb-2">
                        Languages Spoken
                      </h4>
                      <div className="flex gap-2">
                        {driverDetails.languages.map((lang, index) => (
                          <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Name</h4>
                    <p className="text-gray-600">{bookingDetails.customerName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600 flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {bookingDetails.email}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Phone</h4>
                    <p className="text-gray-600 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      {bookingDetails.phone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Package Price:</span>
                    <span>
                      ¥{(totalPrice - (hasAirportTransfer ? 8000 : 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Travelers:</span>
                    <span>{travelers}</span>
                  </div>
                  {hasAirportTransfer && (
                    <div className="flex justify-between text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                        <div className="flex items-center">
                            <Plane className="w-3 h-3 mr-2" />
                            <span>Optional Airport Transfer</span>
                        </div>
                        <span className="font-medium">+ ¥8,000</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Paid:</span>
                      <span className="text-green-600">
                        ¥{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  Payment Method: Credit Card ending in ****1234<br />
                  Transaction ID: TXN{Date.now()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                    onClick={() => setShowItineraryChatbot(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Itinerary
                </Button>
                
                {/* 3. New Download Receipt Button */}
                <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setShowInvoice(true)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>

                <Link to="/offers" className="block">
                  <Button className="w-full" variant="outline">
                    Book Another Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 4. Render Invoice Modal */}
      <InvoiceModal 
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        bookingDetails={bookingDetails}
        packageDetails={selectedPackage}
        paymentDetails={{
            totalPrice: totalPrice,
            travelers: travelers,
            hasAirportTransfer: hasAirportTransfer
        }}
      />

      <ItineraryChatbot
        selectedDestinations={displayDestinations}
        isVisible={showItineraryChatbot}
        onClose={() => setShowItineraryChatbot(false)}
        travelDate={bookingDetails.travelDate}
        travelers={travelers}
      />
    </div>
  );
}