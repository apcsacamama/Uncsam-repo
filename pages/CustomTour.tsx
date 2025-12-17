import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
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
import { CalendarIcon, MapPin, Users, Plane, Train, Car, Info } from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

// --- DATA ---
const ALL_DESTINATIONS = [
  // 1. TOKYO
  { id: "tokyo-tower", name: "Tokyo Tower", description: "Iconic red tower", location: "tokyo", price: 4000 },
  { id: "sensoji", name: "Senso-ji Temple", description: "Historic temple in Asakusa", location: "tokyo", price: 3000 },
  { id: "shibuya", name: "Shibuya Crossing", description: "World's busiest crossing", location: "tokyo", price: 3000 },
  { id: "teamlab", name: "TeamLab Planets", description: "Digital art museum", location: "tokyo", price: 6000 },
  { id: "disney", name: "Tokyo Disneyland", description: "Theme park", location: "tokyo", price: 9500 },
  
  // 2. KYOTO
  { id: "kinkakuji", name: "Kinkaku-ji", description: "The Golden Pavilion", location: "kyoto", price: 4500 },
  { id: "fushimi", name: "Fushimi Inari", description: "Thousands of Torii gates", location: "kyoto", price: 3500 },
  { id: "arashiyama", name: "Bamboo Grove", description: "Scenic bamboo forest", location: "kyoto", price: 4000 },
  { id: "kiyomizu", name: "Kiyomizu-dera", description: "Historic wooden temple", location: "kyoto", price: 4500 },

  // 3. OSAKA
  { id: "dotonbori", name: "Dotonbori", description: "Food district", location: "osaka", price: 3000 },
  { id: "usj", name: "Universal Studios", description: "Theme park", location: "osaka", price: 9800 },
  { id: "osaka-castle", name: "Osaka Castle", description: "Historic castle", location: "osaka", price: 4000 },
  
  // 4. NAGOYA
  { id: "nagoya-castle", name: "Nagoya Castle", description: "Historic castle", location: "nagoya", price: 4000 },
  { id: "legoland", name: "Legoland Japan", description: "Theme park", location: "nagoya", price: 8000 },
  { id: "ghibli", name: "Ghibli Park", description: "Studio Ghibli theme park", location: "nagoya", price: 7000 },
];

export default function CustomTour() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>([]);
  const [travelers, setTravelers] = useState(1);

  // Filter destinations based on selected location
  const filteredDestinations = useMemo(() => {
    if (!location) return [];
    return ALL_DESTINATIONS.filter((dest) => dest.location === location);
  }, [location]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocation(e.target.value);
    setSelectedDestinations([]); // Reset selections when city changes
  };

  const handleDestinationChange = (destinationId: string, checked: boolean) => {
    if (checked) {
      setSelectedDestinations([...selectedDestinations, destinationId]);
    } else {
      setSelectedDestinations(
        selectedDestinations.filter((id) => id !== destinationId),
      );
    }
  };

  const transportationOptions = [
    { id: "bus", label: "Private Bus", icon: Car, price: 5000 },
    { id: "train", label: "Shinkansen (Bullet Train)", icon: Train, price: 8000 },
    { id: "flight", label: "Domestic Flight", icon: Plane, price: 15000 },
  ];

  const handleTransportationChange = (transportId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransportation([...selectedTransportation, transportId]);
    } else {
      setSelectedTransportation(selectedTransportation.filter((id) => id !== transportId));
    }
  };

  // --- UPDATED PRICING LOGIC ---
  
  // 1. Calculate Base Fee (Group Logic)
  // Rule: 20,000 flat for up to 4 people. +5,000 for each person above 4.
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

  // 2. Calculate Add-ons (Per Person Logic)
  // Destinations and Transport are typically per person (ticket price)
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
  
  // 3. Grand Total
  const totalPrice = baseFeeTotal + addonsTotal;

  const isFormValid =
    location &&
    selectedDate &&
    selectedDestinations.length > 0 &&
    selectedTransportation.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div
        className="relative h-64 flex items-center justify-center"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Create Your Own Japanese Experience</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Location & Date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" /> Location and Date
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
                          className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Travelers</Label>
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm" onClick={() => setTravelers(Math.max(1, travelers - 1))} disabled={travelers <= 1}>-</Button>
                      <span className="text-lg font-medium w-8 text-center">{travelers}</span>
                      <Button variant="outline" size="sm" onClick={() => setTravelers(travelers + 1)} disabled={travelers >= 20}>+</Button>
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

            {/* 2. Choose Destinations */}
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
                    {filteredDestinations.map((destination) => {
                      const isSelected = selectedDestinations.includes(destination.id);
                      return (
                        <div
                          key={destination.id}
                          className={cn(
                            "flex items-start space-x-3 p-3 border rounded-lg transition-colors",
                            isSelected ? "border-red-500 bg-red-50" : "hover:bg-gray-50",
                          )}
                        >
                          <Checkbox
                            id={destination.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleDestinationChange(destination.id, checked as boolean)}
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={destination.id}
                              className="font-medium cursor-pointer"
                            >
                              {destination.name}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">{destination.description}</p>
                            <p className="text-sm font-medium text-red-600 mt-1">
                              +¥{destination.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Transportation */}
            <Card>
              <CardHeader>
                <CardTitle>Transportation Upgrades</CardTitle>
                <p className="text-sm text-gray-600">Standard Van included. Select additional options if needed.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportationOptions.map((transport) => (
                    <div key={transport.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={transport.id}
                        checked={selectedTransportation.includes(transport.id)}
                        onCheckedChange={(checked) => handleTransportationChange(transport.id, checked as boolean)}
                      />
                      <transport.icon className="w-6 h-6 text-gray-600" />
                      <div className="flex-1">
                        <Label htmlFor={transport.id} className="font-medium cursor-pointer">{transport.label}</Label>
                        <p className="text-sm font-medium text-red-600">¥{transport.price.toLocaleString()} per person</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-t-4 border-t-red-600">
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

                  {/* Add-ons Breakdown */}
                  {selectedDestinations.length > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-gray-600">Destinations:</span>
                        <span className="text-xs text-gray-400">(¥{destinationPricePerPerson.toLocaleString()} × {travelers} ppl)</span>
                      </div>
                      <span>¥{(destinationPricePerPerson * travelers).toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTransportation.length > 0 && (
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <span className="text-gray-600">Transport:</span>
                            <span className="text-xs text-gray-400">(¥{transportationPricePerPerson.toLocaleString()} × {travelers} ppl)</span>
                        </div>
                      <span>¥{(transportationPricePerPerson * travelers).toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t mt-2 items-center">
                     <span className="font-semibold text-gray-700">Travelers:</span>
                     <span className="font-semibold text-gray-900">{travelers}</span>
                  </div>

                  <div className="flex justify-between items-center text-xl font-bold text-red-600 border-t-2 border-gray-200 pt-3 mt-2">
                    <span>Total:</span>
                    <span>¥{totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Selected List */}
                {(selectedDestinations.length > 0 || selectedTransportation.length > 0) && (
                  <div className="pt-4 border-t space-y-4">
                    {selectedDestinations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-xs text-gray-900 uppercase tracking-wider mb-2">Destinations</h4>
                        <ul className="text-sm space-y-1">
                          {selectedDestinations.map((id) => {
                            const dest = ALL_DESTINATIONS.find((d) => d.id === id);
                            return dest ? <li key={id} className="text-gray-600 flex justify-between items-center gap-2">
                                <span>• {dest.name}</span>
                                <span className="text-xs text-gray-400">¥{dest.price.toLocaleString()}</span>
                            </li> : null;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
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
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg shadow-md mt-4"
                  >
                      Book for ¥{totalPrice.toLocaleString()}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}