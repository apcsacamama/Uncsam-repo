import Navigation from "../components/Navigation";
import ItineraryChatbot from "../components/ItineraryChatbot";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input"; 
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { useState, useMemo } from "react";
import {
  CalendarIcon,
  MapPin,
  Users,
  Plane,
  Train,
  Car,
  Sparkles,
  Info
} from "lucide-react";
import { format, isBefore, startOfToday, isSameDay } from "date-fns"; // Added date helpers
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

// --- OWNER SECTION: MANAGE DESTINATIONS HERE ---
// To add a destination, just copy a line, change the ID, Name, and Details.
const ALL_DESTINATIONS = [
  // TOKYO
  { id: "tokyo-tower", name: "Tokyo Tower", description: "Iconic red tower", location: "tokyo", price: 4000 },
  { id: "sensoji", name: "Senso-ji Temple", description: "Historic temple in Asakusa", location: "tokyo", price: 3000 },
  { id: "shibuya", name: "Shibuya Crossing", description: "World's busiest crossing", location: "tokyo", price: 3000 },
  { id: "teamlab", name: "TeamLab Planets", description: "Digital art museum", location: "tokyo", price: 6000 },
  { id: "disney", name: "Tokyo Disneyland", description: "Theme park", location: "tokyo", price: 9500 },
  
  // KYOTO
  { id: "kinkakuji", name: "Kinkaku-ji", description: "The Golden Pavilion", location: "kyoto", price: 4500 },
  { id: "fushimi", name: "Fushimi Inari", description: "Thousands of Torii gates", location: "kyoto", price: 3500 },
  { id: "arashiyama", name: "Bamboo Grove", description: "Scenic bamboo forest", location: "kyoto", price: 4000 },
  { id: "kiyomizu", name: "Kiyomizu-dera", description: "Historic wooden temple", location: "kyoto", price: 4500 },

  // OSAKA
  { id: "dotonbori", name: "Dotonbori", description: "Food district", location: "osaka", price: 3000 },
  { id: "usj", name: "Universal Studios", description: "Theme park", location: "osaka", price: 9800 },
  { id: "osaka-castle", name: "Osaka Castle", description: "Historic castle", location: "osaka", price: 4000 },
  
  // NAGOYA
  { id: "nagoya-castle", name: "Nagoya Castle", description: "Historic castle", location: "nagoya", price: 4000 },
  { id: "legoland", name: "Legoland Japan", description: "Theme park", location: "nagoya", price: 8000 },
  { id: "ghibli", name: "Ghibli Park", description: "Studio Ghibli theme park", location: "nagoya", price: 7000 },
];

// --- OWNER SECTION: BLOCK DATES HERE ---
// Add dates here in the format: new Date(Year, MonthIndex, Day)
// Note: MonthIndex starts at 0 (January is 0, June is 5, December is 11)
const FULLY_BOOKED_DATES = [
    new Date(2025, 5, 20), // June 20, 2025 is blocked
    new Date(2025, 6, 4),  // July 4, 2025 is blocked
];

export default function CustomTour() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>(["private-van"]); 
  
  const [travelers, setTravelers] = useState(1);
  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);

  // --- LOGIC: Filter destinations by location ---
  const filteredDestinations = useMemo(() => {
    if (!location) return [];
    return ALL_DESTINATIONS.filter((dest) => dest.location === location);
  }, [location]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value);
    setSelectedDestinations([]); 
  };

  // --- LOGIC: Date Blocking ---
  // This function returns true if a date should be disabled
  const isDateDisabled = (date: Date) => {
    // 1. Block Past Dates
    if (isBefore(date, startOfToday())) {
        return true;
    }
    // 2. Block Fully Booked Dates (Owner Controlled)
    const isFullyBooked = FULLY_BOOKED_DATES.some(blockedDate => 
        isSameDay(date, blockedDate)
    );
    if (isFullyBooked) return true;

    return false;
  };

  const transportationOptions = [
    {
      id: "private-van",
      label: "Private Van (Included)",
      icon: Car,
      price: 0,
      included: true,
      addon: false
    },
    {
      id: "airport-transfer",
      label: "Airport Transfer (Add-on)",
      icon: Plane,
      price: 8000,
      included: false,
      addon: true,
    },
  ];

  const handleDestinationChange = (destinationId: string, checked: boolean) => {
    const newDestinations = checked
      ? [...selectedDestinations, destinationId]
      : selectedDestinations.filter((id) => id !== destinationId);

    setSelectedDestinations(newDestinations);

    if (newDestinations.length >= 2 && selectedDate && location) {
      setShowItineraryChatbot(true);
    }
  };

  const handleTransportationChange = (
    transportId: string,
    checked: boolean,
  ) => {
    if (transportId === "private-van") return;

    if (checked) {
      setSelectedTransportation([...selectedTransportation, transportId]);
    } else {
      setSelectedTransportation(
        selectedTransportation.filter((id) => id !== transportId),
      );
    }
  };

  // --- PRICING LOGIC ---
  const calculateBaseFee = () => {
    const includedTravelers = 4;
    const baseRate = 20000;
    const extraPersonRate = 5000;

    if (travelers <= includedTravelers) {
        return baseRate;
    } else {
        const extraPeople = travelers - includedTravelers;
        return baseRate + (extraPeople * extraPersonRate);
    }
  };
  const baseFeeTotal = calculateBaseFee();

  const destinationPricePerPerson = selectedDestinations.reduce((total, id) => {
    const dest = ALL_DESTINATIONS.find((d) => d.id === id);
    return total + (dest ? dest.price : 0);
  }, 0);

  const transportationPricePerPerson = selectedTransportation.reduce(
    (total, transportId) => {
      const transport = transportationOptions.find((t) => t.id === transportId);
      return total + (transport ? transport.price : 0);
    },
    0,
  );

  const addonsTotal = (destinationPricePerPerson + transportationPricePerPerson) * travelers;
  const totalPrice = baseFeeTotal + addonsTotal;

  const isFormValid =
    location && selectedDate && selectedDestinations.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div
        className="relative h-64 flex items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-44xl md:text-5xl font-bold mb-4">
            Create Your Own Japanese Experience
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Design a personalized tour that matches your interests and schedule
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Location and Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  Location and Date
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Select Location</Label>
                  <select
                    id="location"
                    value={location}
                    onChange={handleLocationChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Choose a region...</option>
                    <option value="tokyo">Tokyo</option>
                    <option value="kyoto">Kyoto</option>
                    <option value="osaka">Osaka</option>
                    <option value="nagoya">Nagoya</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Travel Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate
                            ? format(selectedDate, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          // THIS IS THE FIX: Disable past dates AND blocked dates
                          disabled={isDateDisabled} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Travelers</Label>
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelers(Math.max(1, travelers - 1))}
                        disabled={travelers <= 1}
                      >
                        -
                      </Button>
                      <span className="text-lg font-medium w-8 text-center">
                        {travelers}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTravelers(travelers + 1)}
                        disabled={travelers >= 20}
                      >
                        +
                      </Button>
                      <Users className="w-4 h-4 text-gray-500 ml-2" />
                    </div>
                    {/* Pricing Hint */}
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Info className="w-3 h-3" /> Base price covers up to 4 people.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Choose Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Destinations</CardTitle>
                <p className="text-sm text-gray-600">
                  Select the places you'd like to visit in <span className="font-bold text-red-600">{location ? location.toUpperCase() : "..."}</span>
                </p>
              </CardHeader>
              <CardContent>
                {!location ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                        Please select a location above to see available destinations.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                    {filteredDestinations.map((destination) => (
                        <div
                        key={destination.id}
                        className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                        <Checkbox
                            id={destination.id}
                            checked={selectedDestinations.includes(destination.id)}
                            onCheckedChange={(checked) =>
                            handleDestinationChange(
                                destination.id,
                                checked as boolean,
                            )
                            }
                        />
                        <div className="flex-1">
                            <Label
                            htmlFor={destination.id}
                            className="font-medium cursor-pointer"
                            >
                            {destination.name}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                            {destination.description}
                            </p>
                            <p className="text-sm font-medium text-red-600 mt-1">
                            +¥{destination.price.toLocaleString()} per pax
                            </p>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
              </CardContent>
            </Card>

            {/* Transportation */}
            <Card>
              <CardHeader>
                <CardTitle>Transportation Options</CardTitle>
                <p className="text-sm text-gray-600">
                  Private van included in all packages. Add airport transfer if
                  needed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportationOptions.map((transport) => (
                    <div
                      key={transport.id}
                      className={`flex items-center space-x-3 p-4 border rounded-lg ${transport.included ? "bg-green-50 border-green-200" : transport.addon ? "bg-blue-50 border-blue-200" : ""} hover:bg-gray-50`}
                    >
                      <Checkbox
                        id={transport.id}
                        checked={
                          transport.included
                            ? true
                            : selectedTransportation.includes(transport.id)
                        }
                        disabled={transport.included}
                        onCheckedChange={(checked) =>
                          !transport.included &&
                          handleTransportationChange(
                            transport.id,
                            checked as boolean,
                          )
                        }
                      />
                      <transport.icon
                        className={`w-6 h-6 ${transport.included ? "text-green-600" : transport.addon ? "text-blue-600" : "text-gray-600"}`}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={transport.id}
                          className={`font-medium ${transport.included ? "" : "cursor-pointer"}`}
                        >
                          {transport.label}
                        </Label>
                        <p
                          className={`text-sm font-medium ${transport.included ? "text-green-600" : transport.addon ? "text-blue-600" : "text-red-600"}`}
                        >
                          {transport.price === 0
                            ? "Included in package"
                            : `¥${transport.price.toLocaleString()} per pax`}
                        </p>
                        {transport.addon && (
                          <p className="text-xs text-gray-500 mt-1">
                            Optional add-on service
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Tour Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  
                  {/* Base Fee Breakdown */}
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Base Package Fee:</span>
                        <span>¥{baseFeeTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                          {travelers <= 4 ? (
                              <span>Flat rate for 1-4 travelers</span>
                          ) : (
                              <span>
                                  ¥20,000 (first 4) + ¥{(travelers - 4) * 5000} ({travelers - 4} extra × ¥5,000)
                              </span>
                          )}
                      </div>
                  </div>

                  {selectedDestinations.length > 0 && (
                    <div className="flex justify-between text-sm items-center">
                        <div className="flex flex-col">
                            <span>Destinations:</span>
                            <span className="text-xs text-gray-400">(¥{destinationPricePerPerson.toLocaleString()} × {travelers} ppl)</span>
                        </div>
                      <span>¥{(destinationPricePerPerson * travelers).toLocaleString()}</span>
                    </div>
                  )}

                  {transportationPricePerPerson > 0 && (
                    <div className="flex justify-between text-sm items-center">
                        <div className="flex flex-col">
                            <span>Add-on Transport:</span>
                            <span className="text-xs text-gray-400">(¥{transportationPricePerPerson.toLocaleString()} × {travelers} ppl)</span>
                        </div>
                      <span>¥{(transportationPricePerPerson * travelers).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="font-semibold text-gray-700">Travelers:</span>
                    <span className="font-semibold">{travelers}</span>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-red-600">
                        ¥{totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selected Items Summary */}
                {selectedDestinations.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Selected Destinations:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedDestinations.map((id) => {
                          const destination = ALL_DESTINATIONS.find(
                            (d) => d.id === id,
                          );
                          return destination ? (
                            <li key={id}>• {destination.name}</li>
                          ) : null;
                        })}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Transportation:
                      </h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• Private Van (Included)</li>
                        {selectedTransportation.includes(
                          "airport-transfer",
                        ) && <li>• Airport Transfer (Add-on)</li>}
                      </ul>
                    </div>
                  </div>
                )}

                {selectedDestinations.length >= 2 &&
                  selectedDate &&
                  location && (
                    <Button
                      onClick={() => setShowItineraryChatbot(true)}
                      variant="outline"
                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-3 rounded-lg mb-3"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Itinerary
                    </Button>
                  )}

                <Link
                  to={
                    isFormValid
                      ? `/booking-confirmation?custom=true&price=${totalPrice}&travelers=${travelers}`
                      : "#"
                  }
                  className={cn(
                    "block w-full",
                    !isFormValid && "pointer-events-none",
                  )}
                >
                  <Button
                    disabled={!isFormValid}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg"
                  >
                    Get Tickets for ¥{totalPrice.toLocaleString()}
                  </Button>
                </Link>

                {!isFormValid && (
                  <p className="text-xs text-gray-500 text-center">
                    Please complete all required fields to proceed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ItineraryChatbot
        selectedDestinations={selectedDestinations
          .map((id) => {
            const destination = ALL_DESTINATIONS.find((d) => d.id === id);
            return destination ? destination.name : "";
          })
          .filter(Boolean)}
        isVisible={showItineraryChatbot}
        onClose={() => setShowItineraryChatbot(false)}
        travelDate={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
        travelers={travelers}
      />
    </div>
  );
}