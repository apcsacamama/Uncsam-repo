import Navigation from "../components/Navigation";
import ItineraryChatbot from "../components/ItineraryChatbot";
import InvoiceModal from "../components/ReceiptModal"; 
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
  Sparkles,
  Plane,
  Loader2,
  Layers // Added for itinerary icon
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";

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

const DEFAULT_DESTINATIONS = [
  { id: "hasedera", name: "Hasedera Temple" },
  { id: "kotoku-in", name: "Kotoku-in" },
  { id: "hokokuji", name: "Hokokuji Temple" },
  { id: "kenchoji", name: "Kenchoji Temple" },
  { id: "tsurugaoka", name: "Tsurugaoka Hachimangu" },
  { id: "enraku-ji", name: "Enraku-ji Temple" },
  { id: "komachi", name: "Komachi Dori Street" },
  { id: "kokomae", name: "Kokomae Station" },
  { id: "nagoya-castle", name: "Nagoya Castle" },
  { id: "legoland", name: "Legoland Japan" },
  { id: "nagoya-science", name: "Nagoya City Science Museum" },
  { id: "oasis21", name: "Oasis 21" },
  { id: "hakone-open-air", name: "The Hakone Open Air Museum" },
  { id: "hakone-pirate", name: "Hakone Pirate Ship" },
  { id: "owakudani", name: "Owakudani Black Egg" },
  { id: "hakone-yunessun", name: "Hakone Kowakien Yunessun" },
];

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  
  // Standard Params
  const packageId = searchParams.get("package");
  const travelersParam = searchParams.get("travelers") || "1";
  const isCustom = searchParams.get("custom") === "true";
  const urlPrice = searchParams.get("price");
  const travelDateParam = searchParams.get("date");
  const locationParam = searchParams.get("location");
  const addonsParam = searchParams.get("addons"); 
  const cartDataRaw = searchParams.get("cartData"); // <--- New Param

  const hasAirportTransfer = addonsParam && addonsParam.includes("airport-transfer");

  const customerName = searchParams.get("name") || "Valued Customer";
  const customerEmail = searchParams.get("email") || "email@example.com";
  const customerPhone = searchParams.get("phone") || "N/A";

  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [bookingId] = useState(`BK${Math.floor(Date.now() / 1000)}`); // Shorter ID

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);
  const [customItinerary, setCustomItinerary] = useState<any[]>([]);
  const [displayDate, setDisplayDate] = useState(travelDateParam || "");
  const [displayTravelers, setDisplayTravelers] = useState(travelersParam);
  
  const [isLoading, setIsLoading] = useState(!isCustom);

  // --- 1. FETCH DESTINATIONS & PACKAGE ---
  useEffect(() => {
    const initData = async () => {
        // Fetch Destination Names
        const { data: dests } = await supabase.from('tour_destinations').select('*');
        if (dests && dests.length > 0) setAllDestinations(prev => [...prev, ...dests]);

        // Fetch Standard Package Info
        if (packageId && !isCustom) {
            const { data, error } = await supabase.from('tour_packages')
                .select('*')
                .or(`id.eq.${packageId},slug.eq.${packageId}`)
                .single();
            if (!error) setSelectedPackage(data);
            setIsLoading(false);
        } else {
            setIsLoading(false);
        }
    };
    initData();
  }, [packageId, isCustom]);

  // --- 2. PARSE CART DATA ---
  useEffect(() => {
    if (isCustom && cartDataRaw) {
        try {
            const cart = JSON.parse(decodeURIComponent(cartDataRaw));
            setCustomItinerary(cart);

            // Calculate Date Range
            if (cart.length > 0) {
                const first = new Date(cart[0].date);
                const last = new Date(cart[cart.length - 1].date);
                setDisplayDate(`${format(first, "MMM dd")} - ${format(last, "MMM dd, yyyy")}`);
                
                // Calculate Travelers Range
                const counts = cart.map((i: any) => i.travelers);
                const min = Math.min(...counts);
                const max = Math.max(...counts);
                setDisplayTravelers(min === max ? `${min}` : `${min} - ${max}`);
            }
        } catch (e) {
            console.error("Error parsing cart", e);
        }
    }
  }, [isCustom, cartDataRaw]);

  // Helper to find destination name
  const getDestName = (id: string) => {
      const found = allDestinations.find(d => d.id === id);
      return found ? found.name : id;
  };

  const displayInclusions = selectedPackage 
    ? selectedPackage.inclusions || STANDARD_INCLUSIONS 
    : STANDARD_INCLUSIONS;

  // Calculate Total Price
  let totalPrice = 0;
  if (urlPrice) {
    totalPrice = parseInt(urlPrice);
  } else if (selectedPackage) {
    // Fallback calculation for standard tours
    const t = parseInt(travelersParam);
    totalPrice = selectedPackage.price * t; 
  }

  // Driver Details (Mock)
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

      {/* Success Header */}
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
          
          {/* LEFT COLUMN: DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. BOOKING SUMMARY */}
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
                    <p className="text-gray-600 font-mono">{bookingId}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">
                    Confirmed
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm uppercase text-gray-500">Package</h4>
                    <p className="font-semibold text-gray-800">
                      {isCustom
                        ? `Custom Tour (${locationParam ? locationParam.toUpperCase() : "Japan Multi-City"})`
                        : selectedPackage?.title || "Standard Package"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm uppercase text-gray-500">
                      Travel Date
                    </h4>
                    <p className="font-semibold text-gray-800">
                        {displayDate}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm uppercase text-gray-500">
                      Travelers
                    </h4>
                    <p className="font-semibold text-gray-800">
                      {displayTravelers} {parseInt(displayTravelers) === 1 ? "" : ""}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm uppercase text-gray-500">
                      Booking Date
                    </h4>
                    <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* DESTINATIONS SECTION */}
                <div className="border-t pt-4 mt-2">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    {isCustom ? <Layers className="w-4 h-4 text-red-600"/> : <MapPin className="w-4 h-4 text-red-600"/>}
                    {isCustom ? "Your Itinerary" : "Included Destinations"}
                  </h4>
                  
                  {isCustom && customItinerary.length > 0 ? (
                      // CUSTOM ITINERARY VIEW
                      <div className="space-y-3">
                          {customItinerary.map((day, idx) => (
                              <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <Badge className="bg-gray-800 hover:bg-gray-800">Day {idx + 1}</Badge>
                                          <span className="font-bold text-gray-800">{day.location.toUpperCase()}</span>
                                      </div>
                                      <div className="text-xs text-gray-500 flex items-center gap-2">
                                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/>{format(new Date(day.date), "MMM dd")}</span>
                                          <span className="flex items-center"><Users className="w-3 h-3 mr-1"/>{day.travelers}</span>
                                      </div>
                                  </div>
                                  <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                                      {day.destinations.map((destId: string) => (
                                          <li key={destId}>{getDestName(destId)}</li>
                                      ))}
                                  </ul>
                              </div>
                          ))}
                      </div>
                  ) : (
                      // STANDARD LIST VIEW
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedPackage?.destinations || ["Destinations loading..."]).map(
                          (destination: string, index: number) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <MapPin className="w-3 h-3 mr-2 text-red-600" />
                              {destination}
                            </div>
                          ),
                        )}
                      </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 mt-4">Inclusions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {displayInclusions.map((inclusion: string, index: number) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                        {inclusion}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. DRIVER INFO */}
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
                      <h3 className="font-semibold text-green-900">{driverDetails.name}</h3>
                      <p className="text-green-700 text-sm">Professional Tour Driver</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-green-900 mb-1 text-xs uppercase">Contact</h4>
                      <p className="text-green-800 flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-2" /> {driverDetails.phone}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-900 mb-1 text-xs uppercase">Vehicle</h4>
                      <p className="text-green-800 text-sm">{driverDetails.vehicleType}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. CUSTOMER INFO */}
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
                    <h4 className="font-medium text-gray-500 mb-1 text-xs uppercase">Name</h4>
                    <p className="text-gray-800 font-medium">{customerName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500 mb-1 text-xs uppercase">Email</h4>
                    <p className="text-gray-800 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" /> {customerEmail}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-500 mb-1 text-xs uppercase">Phone</h4>
                    <p className="text-gray-800 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" /> {customerPhone}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: ACTIONS */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Package Price:</span>
                    <span>¥{(totalPrice - (hasAirportTransfer ? 8000 : 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Travelers:</span>
                    <span>{displayTravelers}</span>
                  </div>
                  {hasAirportTransfer && (
                    <div className="flex justify-between text-sm text-blue-700 bg-blue-50 p-2 rounded border border-blue-100 mt-2">
                        <div className="flex items-center">
                            <Plane className="w-3 h-3 mr-2" />
                            <span>Airport Transfer</span>
                        </div>
                        <span className="font-medium">+ ¥8,000</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Paid:</span>
                      <span className="text-green-600">¥{totalPrice.toLocaleString()}</span>
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
      
      {/* INVOICE MODAL */}
      <InvoiceModal 
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        bookingDetails={{
            id: bookingId,
            customerName: customerName,
            email: customerEmail,
            phone: customerPhone,
            travelDate: displayDate,
            status: "confirmed",
            createdAt: new Date().toISOString().split("T")[0]
        }}
        packageDetails={selectedPackage || { title: "Custom Itinerary", price: totalPrice }}
        paymentDetails={{
            totalPrice: totalPrice,
            travelers: parseInt(travelersParam), // Rough estimate for invoice logic
            hasAirportTransfer: hasAirportTransfer
        }}
      />

      <ItineraryChatbot
        selectedDestinations={customItinerary.length > 0 ? customItinerary.flatMap(d => d.destinations) : (selectedPackage?.destinations || [])}
        isVisible={showItineraryChatbot}
        onClose={() => setShowItineraryChatbot(false)}
        travelDate={displayDate}
        travelers={parseInt(travelersParam)}
      />
    </div>
  );
}