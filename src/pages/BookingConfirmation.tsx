import Navigation from "../components/Navigation";
import ItineraryChatbot from "../components/ItineraryChatbot";
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
  Sparkles 
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { tourPackages } from "../data/offers";
import { useState } from "react";

export default function BookingConfirmation() {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package");
  const travelers = searchParams.get("travelers") || "1";
  const isCustom = searchParams.get("custom") === "true";
  const customPrice = searchParams.get("price");

  // --- NEW: GET CUSTOMER DATA FROM URL ---
  const customerName = searchParams.get("name") || "Valued Customer";
  const customerEmail = searchParams.get("email") || "email@example.com";
  const customerPhone = searchParams.get("phone") || "N/A";

  // State for AI Chatbot
  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);

  const [bookingId] = useState(`BK${Date.now()}`);
  const selectedPackage = packageId
    ? tourPackages.find((p) => p.id === packageId)
    : null;

  const totalPrice =
    isCustom && customPrice
      ? parseInt(customPrice)
      : selectedPackage
        ? selectedPackage.price * parseInt(travelers)
        : 0;

  const bookingDetails = {
    id: bookingId,
    customerName: customerName, // Dynamic Name
    email: customerEmail,       // Dynamic Email
    phone: customerPhone,       // Dynamic Phone
    travelDate: "2026-01-07"
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

  // Destinations to pass to AI (Mock data if custom, else package data)
  const itineraryDestinations = selectedPackage 
    ? selectedPackage.destinations 
    : ["Nagoya Castle", "Legoland", "Oasis 21", "Ghibli Park"]; 

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

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
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Summary */}
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
                        ? "Custom Tour Package"
                        : selectedPackage?.title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Travel Date
                    </h4>
                    <p className="text-gray-600">{bookingDetails.travelDate}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Travelers
                    </h4>
                    <p className="text-gray-600">
                      {travelers}{" "}
                      {parseInt(travelers) === 1 ? "person" : "people"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Booking Date
                    </h4>
                    <p className="text-gray-600">{bookingDetails.createdAt}</p>
                  </div>
                </div>

                {selectedPackage && !isCustom && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Included Destinations
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPackage.destinations.map(
                        (destination, index) => (
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
                )}

                {selectedPackage && !isCustom && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Inclusions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {selectedPackage.inclusions.map((inclusion, index) => (
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
                )}
              </CardContent>
            </Card>

            {/* Driver Information */}
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
                      {driverDetails.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
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
                          <Badge
                            key={index}
                            className="bg-green-100 text-green-800 text-xs"
                          >
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Important:</strong> Your driver will contact you 24
                    hours before your tour to confirm pickup details and answer
                    any questions.
                  </p>
                  <p>
                    For immediate assistance, you can contact your driver
                    directly at the number provided above.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
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
                    <p className="text-gray-600">
                      {bookingDetails.customerName}
                    </p>
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

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>What's Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 rounded-full p-2 mt-1">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Confirmation Email</h4>
                      <p className="text-gray-600 text-sm">
                        You'll receive a detailed confirmation email within the
                        next few minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-green-100 rounded-full p-2 mt-1">
                      <Phone className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Pre-Travel Contact</h4>
                      <p className="text-gray-600 text-sm">
                        Our team will contact you 48 hours before your travel
                        date with final details.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-yellow-100 rounded-full p-2 mt-1">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Travel Day</h4>
                      <p className="text-gray-600 text-sm">
                        Be ready for pickup at your hotel lobby at the scheduled
                        time.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary & Actions */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Package Price:</span>
                    <span>
                      ¥
                      {Math.floor(
                        totalPrice / parseInt(travelers),
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Travelers:</span>
                    <span>{travelers}</span>
                  </div>
                  
                  {/* Tax Lines Removed */}

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
                  Payment Method: Credit Card ending in ****1234
                  <br />
                  Transaction ID: TXN{Date.now()}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                
                {/* Generate AI Itinerary Button */}
                <Button 
                    onClick={() => setShowItineraryChatbot(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Itinerary
                </Button>

                <Button className="w-full" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>

                <Button className="w-full" variant="outline">
                  <Share className="w-4 h-4 mr-2" />
                  Share Booking
                </Button>

                <Link to="/profile" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    View My Bookings
                  </Button>
                </Link>

                <Link to="/offers" className="block">
                  <Button className="w-full" variant="outline">
                    Book Another Trip
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium">Customer Support</h4>
                    <p className="text-gray-600">Available 24/7</p>
                    <p className="text-blue-600">+81-3-1234-5678</p>
                  </div>

                  <div>
                    <h4 className="font-medium">Email Support</h4>
                    <p className="text-blue-600">support@unclesam-travel.com</p>
                  </div>

                  <Link to="/faq">
                    <Button size="sm" variant="outline" className="w-full">
                      View FAQ
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* AI Chatbot Component */}
      <ItineraryChatbot
        selectedDestinations={itineraryDestinations}
        isVisible={showItineraryChatbot}
        onClose={() => setShowItineraryChatbot(false)}
        travelDate={bookingDetails.travelDate}
        travelers={parseInt(travelers)}
      />
    </div>
  );
}
