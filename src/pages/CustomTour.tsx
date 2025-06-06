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
import { destinations } from "../data/offers";
import { useState } from "react";
import {
  CalendarIcon,
  MapPin,
  Users,
  Plane,
  Train,
  Car,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";

export default function CustomTour() {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    [],
  );
  const [selectedTransportation, setSelectedTransportation] = useState<
    string[]
  >([]);
  const [travelers, setTravelers] = useState(1);
  const [showItineraryChatbot, setShowItineraryChatbot] = useState(false);

  const transportationOptions = [
    { id: 'private-van', label: 'Private Van (Included)', icon: Car, price: 0, included: true },
    { id: 'airport-transfer', label: 'Airport Transfer (Add-on)', icon: Plane, price: 8000, addon: true },
  ];

  const handleDestinationChange = (destinationId: string, checked: boolean) => {
    const newDestinations = checked
      ? [...selectedDestinations, destinationId]
      : selectedDestinations.filter((id) => id !== destinationId);

    setSelectedDestinations(newDestinations);

    // Show itinerary chatbot when 2 or more destinations are selected
    if (newDestinations.length >= 2 && selectedDate && location) {
      setShowItineraryChatbot(true);
    }
  };

  const handleTransportationChange = (
    transportId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedTransportation([...selectedTransportation, transportId]);
    } else {
      setSelectedTransportation(
        selectedTransportation.filter((id) => id !== transportId),
      );
    }
  };

  // Calculate pricing
  const basePrice = 20000; // Base tour price
  const destinationPrice = selectedDestinations.length * 5000;
  const transportationPrice = selectedTransportation.reduce(
    (total, transportId) => {
      const transport = transportationOptions.find((t) => t.id === transportId);
      return total + (transport ? transport.price : 0);
    },
    0,
  );
  const totalPrice =
    (basePrice + destinationPrice + transportationPrice) * travelers;

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
          backgroundImage:
            "url(https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
        <div className="relative z-10 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
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
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Choose a region...</option>
                    <option value="tokyo">Tokyo</option>
                    <option value="kyoto">Kyoto</option>
                    <option value="osaka">Osaka</option>
                    <option value="nagoya">Nagoya</option>
                    <option value="hiroshima">Hiroshima</option>
                    <option value="fukuoka">Fukuoka</option>
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
                        disabled={travelers >= 10}
                      >
                        +
                      </Button>
                      <Users className="w-4 h-4 text-gray-500 ml-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Choose Destinations */}
            <Card>
              <CardHeader>
                <CardTitle>Choose Destinations</CardTitle>
                <p className="text-sm text-gray-600">
                  Select the places you'd like to visit
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {destinations.map((destination) => (
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
                          +¥5,000 per pax
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transportation */}
            <Card>
              <CardHeader>
                <CardTitle>Transportation Options</CardTitle>
                <p className="text-sm text-gray-600">Private van included in all packages. Add airport transfer if needed.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportationOptions.map((transport) => (
                    <div key={transport.id} className={`flex items-center space-x-3 p-4 border rounded-lg ${transport.included ? 'bg-green-50 border-green-200' : transport.addon ? 'bg-blue-50 border-blue-200' : ''} hover:bg-gray-50`}>
                      <Checkbox
                        id={transport.id}
                        checked={transport.included ? true : selectedTransportation.includes(transport.id)}
                        disabled={transport.included}
                        onCheckedChange={(checked) =>
                          !transport.included && handleTransportationChange(transport.id, checked as boolean)
                        }
                      />
                      <transport.icon className={`w-6 h-6 ${transport.included ? 'text-green-600' : transport.addon ? 'text-blue-600' : 'text-gray-600'}`} />
                      <div className="flex-1">
                        <Label
                          htmlFor={transport.id}
                          className={`font-medium ${transport.included ? '' : 'cursor-pointer'}`}
                        >
                          {transport.label}
                        </Label>
                        <p className={`text-sm font-medium ${transport.included ? 'text-green-600' : transport.addon ? 'text-blue-600' : 'text-red-600'}`}>
                          {transport.price === 0 ? 'Included in package' : `¥${transport.price.toLocaleString()} per pax`}
                        </p>
                        {transport.addon && (
                          <p className="text-xs text-gray-500 mt-1">
                            Optional add-on service not included in standard package
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </Card>
          </div>

          {/* Summary Section */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Tour Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Base tour price:</span>
                    <span>¥{basePrice.toLocaleString()}</span>
                  </div>

                  {selectedDestinations.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Destinations ({selectedDestinations.length}):</span>
                      <span>¥{destinationPrice.toLocaleString()}</span>
                    </div>
                  )}

                  {selectedTransportation.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Transportation:</span>
                      <span>¥{transportationPrice.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm">
                    <span>Travelers:</span>
                    <span>{travelers}</span>
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
                {(selectedDestinations.length > 0 ||
                  selectedTransportation.length > 0) && (
                  <div className="space-y-3 pt-4 border-t">
                    {selectedDestinations.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Selected Destinations:
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {selectedDestinations.map((id) => {
                            const destination = destinations.find(
                              (d) => d.id === id,
                            );
                            return destination ? (
                              <li key={id}>• {destination.name}</li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}

                    {selectedTransportation.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 mb-2">
                          Transportation:
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {selectedTransportation.map((id) => {
                            const transport = transportationOptions.find(
                              (t) => t.id === id,
                            );
                            return transport ? (
                              <li key={id}>• {transport.label}</li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}
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
            const destination = destinations.find((d) => d.id === id);
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