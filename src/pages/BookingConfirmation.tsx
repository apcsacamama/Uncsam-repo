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
  Loader2,
  Layers,
  Plane
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";

const STANDARD_INCLUSIONS = [
  "12-Hour Private Tour",
  "Professional Driver",
  "Hotel Pick-up & Drop-off",
  "Gas & Tolls Included",
  "Private Van Transportation"
];

// Fallback data
const DEFAULT_DESTINATIONS = [
  { id: "hasedera", name: "Hasedera Temple" },
  { id: "kotoku-in", name: "Kotoku-in" },
];

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  
  // URL Parameters
  const packageId = searchParams.get("package");
  const travelersParam = searchParams.get("travelers") || "1";
  const isCustom = searchParams.get("custom") === "true";
  const urlPrice = searchParams.get("price");
  const locationParam = searchParams.get("location");
  const addonsParam = searchParams.get("addons"); 
  const cartDataRaw = searchParams.get("cartData");

  // --- PAYMENT PARAMS ---
  const paymentTypeParam = searchParams.get("paymentType"); // 'full' or 'downpayment'
  const amountPaidParam = searchParams.get("amountPaid");
  const balanceParam = searchParams.get("balance");

  const hasAirportTransfer = addonsParam && addonsParam.includes("airport-transfer");
  const customerName = searchParams.get("name") || "Valued Customer";
  const customerEmail = searchParams.get("email") || "email@example.com";
  const customerPhone = searchParams.get("phone") || "N/A";

  // State
  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [bookingId] = useState(`BK${Math.floor(Date.now() / 1000)}`);

  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);
  const [customItinerary, setCustomItinerary] = useState<any[]>([]);
  
  // Display State
  const [displayDate, setDisplayDate] = useState(searchParams.get("date") || "");
  const [displayTravelers, setDisplayTravelers] = useState(travelersParam);
  const [isLoading, setIsLoading] = useState(!isCustom);

  // --- 1. FETCH DESTINATIONS & PACKAGE ---
  useEffect(() => {
    const initData = async () => {
        const { data: dests } = await supabase.from('tour_destinations').select('*');
        if (dests && dests.length > 0) setAllDestinations(prev => [...prev, ...dests]);

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

  // --- 2. PARSE CUSTOM CART DATA ---
  useEffect(() => {
    if (isCustom && cartDataRaw) {
        try {
            const cart = JSON.parse(decodeURIComponent(cartDataRaw));
            setCustomItinerary(cart);

            if (cart.length > 0) {
                const uniqueDates = Array.from(new Set(cart.map((i: any) => format(new Date(i.date), "MMM dd, yyyy"))));
                setDisplayDate(uniqueDates.join(" | "));
                
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

  const getDestName = (id: string) => {
      const found = allDestinations.find(d => d.id === id);
      return found ? found.name : id;
  };

  const displayInclusions = selectedPackage 
    ? selectedPackage.inclusions || STANDARD_INCLUSIONS 
    : STANDARD_INCLUSIONS;

  // --- CALCULATE TOTALS ---
  const totalPrice = urlPrice ? parseInt(urlPrice) : 0;
  const amountPaid = amountPaidParam ? parseInt(amountPaidParam) : totalPrice;
  const balance = balanceParam ? parseInt(balanceParam) : 0;

  const driverDetails = {
    name: "Takeshi Yamamoto",
    phone: "+81 80-5331-1738",
    languages: ["English", "Japanese", "Tagalog"],
    vehicleType: "Private Van",
    licenseNumber: "JP-2024-001",
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-green-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      
      {/* Success Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-full p-3"><CheckCircle className="w-12 h-12 text-green-600" /></div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-xl text-green-100">Thank you for your booking. Your Japanese adventure awaits!</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: BOOKING DETAILS */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* 1. SUMMARY CARD */}
                <Card className="shadow-lg border-t-4 border-t-[#2eb85c]">
                    <CardHeader className="border-b bg-gray-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="w-5 h-5 text-gray-500" /> Booking Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Booking ID</p>
                                <p className="text-lg font-mono font-bold text-gray-800">{bookingId}</p>
                            </div>
                            <Badge className="bg-green-100 text-green-800 px-3 py-1 text-sm border-green-200">Confirmed</Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Package</p>
                                <p className="font-semibold text-gray-900">{isCustom ? `Custom Tour (${locationParam ? locationParam.toUpperCase() : "Japan"})` : selectedPackage?.title || "Standard Package"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Travel Date</p>
                                <p className="font-semibold text-gray-900">{displayDate}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Travelers</p>
                                <p className="font-semibold text-gray-900">{displayTravelers} {parseInt(displayTravelers) === 1 ? "Person" : "People"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Booking Date</p>
                                <p className="font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                {isCustom ? <Layers className="w-4 h-4 text-red-600"/> : <MapPin className="w-4 h-4 text-red-600"/>}
                                {isCustom ? "Planned Destinations (Custom)" : "Included Destinations"}
                            </h4>

                            {isCustom && customItinerary.length > 0 ? (
                                <div className="space-y-4">
                                    {customItinerary.map((day, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">Day {idx + 1}</span>
                                                    <span className="font-bold text-gray-800 text-sm">{day.location.toUpperCase()}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-3">
                                                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1"/>{format(new Date(day.date), "MMM dd")}</span>
                                                    <span className="flex items-center"><Users className="w-3 h-3 mr-1"/>{day.travelers}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {day.destinations.map((destId: string) => (
                                                    <div key={destId} className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="w-3 h-3 mr-2 text-red-500 flex-shrink-0" />
                                                        {getDestName(destId)}
                                                    </div>
                                                ))}
                                                {day.transportation && day.transportation.includes("airport-transfer") && (
                                                    <div className="flex items-center text-sm text-blue-600 font-medium sm:col-span-2 mt-1 bg-blue-50 p-2 rounded border border-blue-100">
                                                        <Plane className="w-4 h-4 mr-2" /> Airport Transfer Included
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {(selectedPackage?.destinations || ["Destinations loading..."]).map(
                                        (destination: string, index: number) => (
                                            <div key={index} className="flex items-start text-sm text-gray-600">
                                                <MapPin className="w-3 h-3 mr-2 text-red-600 mt-0.5" />
                                                {destination}
                                            </div>
                                        ),
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-bold text-green-900 mb-2 text-sm">Included Services</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {displayInclusions.map((inclusion: string, index: number) => (
                                    <div key={index} className="flex items-center text-sm text-green-700">
                                        <CheckCircle className="w-3 h-3 mr-2 text-green-600" />
                                        {inclusion}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </CardContent>
                </Card>

                {/* 2. DRIVER & CUSTOMER INFO */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-blue-600" /> Your Driver</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">TY</div>
                                <div><p className="font-bold text-gray-900">{driverDetails.name}</p><p className="text-xs text-gray-500">{driverDetails.licenseNumber}</p></div>
                            </div>
                            <div className="pt-2 border-t space-y-1">
                                <p className="flex items-center text-gray-600"><Phone className="w-3 h-3 mr-2"/> {driverDetails.phone}</p>
                                <p className="text-gray-600">Vehicle: {driverDetails.vehicleType}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Customer</CardTitle></CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div><p className="text-xs text-gray-500 uppercase">Name</p><p className="font-medium text-gray-900">{customerName}</p></div>
                            <div><p className="text-xs text-gray-500 uppercase">Contact</p><p className="text-gray-600">{customerEmail}</p><p className="text-gray-600">{customerPhone}</p></div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* RIGHT COLUMN: ACTIONS & SUMMARY */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="sticky top-8">
                    <CardHeader><CardTitle>Payment Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between"><span>Package Price</span><span>¥{(totalPrice - (hasAirportTransfer ? 8000 : 0)).toLocaleString()}</span></div>
                            <div className="flex justify-between"><span>Travelers</span><span>{displayTravelers}</span></div>
                            {hasAirportTransfer && (
                                <div className="flex justify-between text-blue-600 bg-blue-50 px-2 py-1 rounded"><span>Airport Transfer</span><span>+¥8,000</span></div>
                            )}
                            
                            <div className="border-t pt-3 flex justify-between items-center font-bold text-lg text-green-700">
                                <span>Total Paid</span>
                                <span>¥{amountPaid.toLocaleString()}</span>
                            </div>
                            
                            {balance > 0 && (
                                <div className="flex justify-between items-center font-bold text-sm text-red-600 bg-red-50 p-2 rounded">
                                    <span>Balance Due</span>
                                    <span>¥{balance.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-3 rounded text-xs text-gray-500">
                            <p className="mb-1">Payment Method: Credit Card (****1234)</p>
                            <p>Transaction ID: TXN{bookingId.replace("BK","")}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Booking Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <Button onClick={() => setShowItineraryChatbot(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white"><Sparkles className="w-4 h-4 mr-2" /> Generate AI Itinerary</Button>
                        <Button className="w-full" variant="outline" onClick={() => setShowInvoice(true)}><Download className="w-4 h-4 mr-2" /> Download Invoice</Button>
                        <Link to="/offers" className="block"><Button className="w-full" variant="ghost">Book Another Trip</Button></Link>
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
            status: balance > 0 ? "partial" : "confirmed",
            details: customItinerary // PASS THIS!
        }}
        packageDetails={selectedPackage || { title: isCustom ? "Custom Tour Package" : "Standard Package", price: totalPrice }}
        paymentDetails={{
            totalPrice: totalPrice,
            travelers: parseInt(travelersParam), 
            hasAirportTransfer: hasAirportTransfer,
            paymentType: paymentTypeParam as 'full' | 'downpayment', // Pass Payment Type
            amountPaid: amountPaid,
            balance: balance
        }}
      />

      <ItineraryChatbot
        // Standard destinations fallback
        selectedDestinations={customItinerary.length > 0 ? customItinerary.flatMap(d => d.destinations) : (selectedPackage?.destinations || [])}
        
        // --- THIS IS THE FIX: PASS MULTI-DAY DATA HERE ---
        customItinerary={customItinerary.length > 0 ? customItinerary : undefined}
        
        isVisible={showItineraryChatbot}
        onClose={() => setShowItineraryChatbot(false)}
        travelDate={displayDate}
        travelers={parseInt(travelersParam)}
      />
    </div>
  );
}