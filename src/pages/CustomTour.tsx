import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input"; // Import Input
import { Textarea } from "../components/ui/textarea"; // Import Textarea
import { supabase } from "../lib/supabaseClient"; 
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
import { useState, useMemo, useEffect } from "react";
import {
  CalendarIcon, MapPin, Users, Plane, Car, Info, AlertCircle, 
  Settings, Plus, X, Save, Trash2, Edit, Loader2
} from "lucide-react";
import { format, isBefore, startOfToday, isSameDay } from "date-fns";
import { cn } from "../lib/utils";
import { Link } from "react-router-dom";
import { useIsAdmin } from "../hooks/useIsAdmin"; // Import the Admin Hook

// --- CONFIGURATION: Pricing Tiers ---
const PRICING_CONFIG: Record<string, { tier1: number; tier2: number }> = {
  nara: { tier1: 85000, tier2: 105000 },
  hakone: { tier1: 75000, tier2: 95000 },
  nagoya: { tier1: 85000, tier2: 105000 },
};

const MAX_TRAVELERS = 9;
const MIN_DESTINATIONS = 4;
const MAX_DESTINATIONS = 5;

// --- DATA: Default Destinations (Fallback) ---
const DEFAULT_DESTINATIONS = [
  // NARA
  { id: "hasedera", name: "Hasedera Temple", description: "Temple with a massive wooden statue", location: "nara" },
  { id: "kotoku-in", name: "Kotoku-in", description: "The Great Buddha", location: "nara" },
  { id: "hokokuji", name: "Hokokuji Temple", description: "Famous bamboo garden temple", location: "nara" },
  // ... (Your other defaults)
];

// --- OWNER SECTION: BLOCK DATES HERE ---
const FULLY_BOOKED_DATES = [
    new Date(2025, 12, 25), 
    new Date(2025, 12, 31), 
];

export default function CustomTour() {
  const { isAdmin } = useIsAdmin(); // Check if owner
  
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>(["private-van"]); 
  const [travelers, setTravelers] = useState(1);
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);

  // --- ADMIN STATE ---
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSavingDest, setIsSavingDest] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [destForm, setDestForm] = useState({ name: "", description: "", location: "nagoya" });

  // --- NEW: Fetch Destinations from Supabase ---
  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase.from('tour_destinations').select('*');
      if (!error && data && data.length > 0) {
         setAllDestinations(data);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };

  // --- LOGIC: Filter destinations ---
  const filteredDestinations = useMemo(() => {
    if (!location) return [];
    return allDestinations.filter((dest) => dest.location === location);
  }, [location, allDestinations]);

  // Handle Location Change
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setSelectedDestinations([]); 
    setTravelers(1); 
    // Update admin form to match selected location for convenience
    setDestForm(prev => ({ ...prev, location: newLocation || "nagoya" }));
  };

  // --- LOGIC: Date Blocking ---
  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfToday())) return true; 
    const isFullyBooked = FULLY_BOOKED_DATES.some(blockedDate => isSameDay(date, blockedDate));
    if (isFullyBooked) return true; 
    return false;
  };

  const transportationOptions = [
    { id: "private-van", label: "Private Van (Included)", icon: Car, price: 0, included: true, addon: false },
    { id: "airport-transfer", label: "Airport Transfer (Add-on)", icon: Plane, price: 8000, included: false, addon: true },
  ];

  const handleDestinationChange = (destinationId: string, checked: boolean) => {
    if (checked) {
        if (selectedDestinations.length >= MAX_DESTINATIONS) return; 
        setSelectedDestinations([...selectedDestinations, destinationId]);
    } else {
        setSelectedDestinations(selectedDestinations.filter((id) => id !== destinationId));
    }
  };

  const handleTransportationChange = (transportId: string, checked: boolean) => {
    if (transportId === "private-van") return;
    if (checked) {
      setSelectedTransportation([...selectedTransportation, transportId]);
    } else {
      setSelectedTransportation(selectedTransportation.filter((id) => id !== transportId));
    }
  };

  // --- ADMIN FUNCTIONS ---
  const handleSaveDestination = async () => {
    if (!destForm.name || !destForm.location) {
        alert("Please provide a name and location.");
        return;
    }
    
    setIsSavingDest(true);
    try {
        if (editingDestId) {
            // UPDATE EXISTING
            const { error } = await supabase
                .from('tour_destinations')
                .update({
                    name: destForm.name,
                    description: destForm.description,
                    location: destForm.location
                })
                .eq('id', editingDestId);
            if (error) throw error;
            alert("Destination updated!");
        } else {
            // INSERT NEW
            const id = destForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
            const { error } = await supabase
                .from('tour_destinations')
                .insert([{
                    id: id,
                    name: destForm.name,
                    description: destForm.description,
                    location: destForm.location
                }]);
            if (error) throw error;
            alert("New destination added!");
        }

        fetchDestinations(); // Refresh
        setEditingDestId(null);
        setDestForm({ name: "", description: "", location: location || "nagoya" });
    } catch (error) {
        console.error("Error saving destination:", error);
        alert("Failed to save.");
    } finally {
        setIsSavingDest(false);
    }
  };

  const handleDeleteDestination = async (id: string) => {
      if(!confirm("Are you sure? This cannot be undone.")) return;
      try {
          const { error } = await supabase.from('tour_destinations').delete().eq('id', id);
          if (error) throw error;
          fetchDestinations();
      } catch (err) {
          console.error(err);
          alert("Failed to delete.");
      }
  };

  const prepareEdit = (dest: any) => {
      setEditingDestId(dest.id);
      setDestForm({ name: dest.name, description: dest.description, location: dest.location });
  };

  // --- TIERED PRICING LOGIC ---
  const getPackagePrice = () => {
    if (!location) return 0;
    const config = PRICING_CONFIG[location];
    if (!config) return 0;
    if (travelers <= 6) return config.tier1;
    else if (travelers <= 9) return config.tier2;
    return 0;
  };

  const basePrice = getPackagePrice();
  const transportationPriceTotal = selectedTransportation.reduce((total, transportId) => {
      const transport = transportationOptions.find((t) => t.id === transportId);
      return total + (transport ? transport.price : 0); 
    }, 0);
  const totalPrice = basePrice + transportationPriceTotal;
  const isDestinationCountValid = selectedDestinations.length >= MIN_DESTINATIONS && selectedDestinations.length <= MAX_DESTINATIONS;
  const isFormValid = location && selectedDate && isDestinationCountValid;
  const addonsString = selectedTransportation.filter(t => t !== 'private-van').join(',');

  return (
    <div className="min-h-screen bg-gray-50">

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
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. Location & Date */}
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
                    <option value="nagoya">Nagoya</option>
                    <option value="hakone">Hakone</option>
                    <option value="nara">Nara</option>
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
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          disabled={isDateDisabled} 
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Travelers</Label>
                    <div className="flex items-center space-x-3">
                      <Button variant="outline" size="sm" onClick={() => setTravelers(Math.max(1, travelers - 1))} disabled={travelers <= 1}>-</Button>
                      <span className="text-lg font-medium w-8 text-center">{travelers}</span>
                      <Button variant="outline" size="sm" onClick={() => setTravelers(travelers + 1)} disabled={travelers >= MAX_TRAVELERS}>+</Button>
                      <Users className="w-4 h-4 text-gray-500 ml-2" />
                    </div>
                    {location && (
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <p className="flex items-center gap-1"><Info className="w-3 h-3" /> Max 9 travelers allowed.</p>
                            <p className="font-medium text-blue-600">Current Tier: {travelers <= 6 ? "1-6 Travelers" : "7-9 Travelers"}</p>
                        </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-bold mb-1">Important Notice</p>
                    <p>Air fare and hotel accommodation are <strong>not included</strong> in the tour package price.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Choose Destinations */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Choose Destinations</CardTitle>
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "text-sm font-medium",
                            selectedDestinations.length >= MIN_DESTINATIONS && selectedDestinations.length <= MAX_DESTINATIONS ? "text-green-600" : "text-gray-500"
                        )}>
                            {selectedDestinations.length} / {MAX_DESTINATIONS} selected
                        </span>
                        
                        {/* --- ADMIN BUTTON --- */}
                        {isAdmin && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                                onClick={() => setIsDestModalOpen(true)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage Places
                            </Button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-600">
                  Select {MIN_DESTINATIONS}-{MAX_DESTINATIONS} places in <span className="font-bold text-red-600">{location ? location.toUpperCase() : "..."}</span>
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
                        const isDisabled = !isSelected && selectedDestinations.length >= MAX_DESTINATIONS;

                        return (
                            <div key={destination.id} className={cn("flex items-start space-x-3 p-3 border rounded-lg transition-colors", isSelected ? "border-red-500 bg-red-50" : "hover:bg-gray-50", isDisabled && "opacity-50 cursor-not-allowed bg-gray-100")}>
                                <Checkbox
                                    id={destination.id}
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => handleDestinationChange(destination.id, checked as boolean)}
                                />
                                <div className="flex-1">
                                    <Label htmlFor={destination.id} className={cn("font-medium", isDisabled ? "cursor-not-allowed" : "cursor-pointer")}>
                                        {destination.name}
                                    </Label>
                                    <p className="text-sm text-gray-600 mt-1">{destination.description}</p>
                                    <p className="text-sm font-medium text-green-600 mt-1">Included in Package</p>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
                {selectedDestinations.length === MAX_DESTINATIONS && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
                        <AlertCircle className="w-4 h-4" />
                        <span>Maximum of {MAX_DESTINATIONS} destinations reached. Uncheck one to select another.</span>
                    </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Transportation */}
            <Card>
              <CardHeader>
                <CardTitle>Transportation Upgrades</CardTitle>
                <p className="text-sm text-gray-600">Private van included. Add airport transfer if needed.</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transportationOptions.map((transport) => (
                    <div key={transport.id} className={`flex items-center space-x-3 p-4 border rounded-lg ${transport.included ? "bg-green-50 border-green-200" : transport.addon ? "bg-blue-50 border-blue-200" : ""} hover:bg-gray-50`}>
                      <Checkbox
                        id={transport.id}
                        checked={transport.included ? true : selectedTransportation.includes(transport.id)}
                        disabled={transport.included}
                        onCheckedChange={(checked) => !transport.included && handleTransportationChange(transport.id, checked as boolean)}
                      />
                      <transport.icon className={`w-6 h-6 ${transport.included ? "text-green-600" : transport.addon ? "text-blue-600" : "text-gray-600"}`} />
                      <div className="flex-1">
                        <Label htmlFor={transport.id} className={`font-medium ${transport.included ? "" : "cursor-pointer"}`}>{transport.label}</Label>
                        <p className={`text-sm font-medium ${transport.included ? "text-green-600" : transport.addon ? "text-blue-600" : "text-red-600"}`}>
                          {transport.price === 0 ? "Included in package" : `¥${transport.price.toLocaleString()} per group`}
                        </p>
                        {transport.addon && <p className="text-xs text-gray-500 mt-1">Optional add-on service</p>}
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
              <CardHeader><CardTitle>Tour Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Package Price:</span>
                        <span>{basePrice > 0 ? `¥${basePrice.toLocaleString()}` : "---"}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                          {location ? <span>Flat rate for {location.toUpperCase()} ({travelers} travelers)</span> : <span>Select a location to see pricing</span>}
                      </div>
                  </div>
                  {transportationPriceTotal > 0 && (
                    <div className="flex justify-between text-sm items-center">
                        <div className="flex flex-col">
                            <span>Add-on Transport:</span>
                            <span className="text-xs text-gray-400">(Airport Transfer - Flat Rate)</span>
                        </div>
                      <span>¥{transportationPriceTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t pt-2 mt-2">
                    <span className="font-semibold text-gray-700">Travelers:</span>
                    <span className="font-semibold">{travelers}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-red-600">¥{totalPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {selectedDestinations.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Selected Destinations:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {selectedDestinations.map((id) => {
                          const destination = allDestinations.find((d) => d.id === id);
                          return destination ? <li key={id}>• {destination.name}</li> : null;
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                <Link
                  to={isFormValid ? `/payment?package=custom-${location}&location=${location}&custom=true&date=${selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}&travelers=${travelers}&price=${totalPrice}&addons=${addonsString}&name=Valued+Customer` : "#"}
                  className={cn("block w-full", !isFormValid && "pointer-events-none")}
                >
                  <Button disabled={!isFormValid} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg">
                    {basePrice > 0 ? `Book for ¥${totalPrice.toLocaleString()}` : "Select Details"}
                  </Button>
                </Link>

                {!isFormValid && (
                  <div className="text-xs text-center space-y-1 text-gray-500">
                    <p>Please complete requirements:</p>
                    <ul className="list-disc list-inside">
                        {!location && <li>Select a location</li>}
                        {!selectedDate && <li>Pick a date</li>}
                        {selectedDestinations.length < MIN_DESTINATIONS && <li>Select at least {MIN_DESTINATIONS} destinations</li>}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* --- ADMIN MODAL FOR DESTINATIONS --- */}
      {isDestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 py-3">
              <div>
                  <CardTitle>Manage Destinations</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Add, edit, or remove places for {location ? location.toUpperCase() : "all regions"}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setIsDestModalOpen(false); setEditingDestId(null); }}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-1 overflow-hidden p-0">
                
                {/* LIST SIDE (Left) */}
                <div className="w-1/2 border-r bg-white overflow-y-auto p-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 sticky top-0 bg-white pb-2 border-b">
                        Current Places {location && `in ${location}`}
                    </h3>
                    <div className="space-y-2">
                        {filteredDestinations.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No destinations found for this region.</p>
                        ) : (
                            filteredDestinations.map(dest => (
                                <div key={dest.id} className={cn("p-3 border rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors", editingDestId === dest.id && "border-red-500 bg-red-50 ring-1 ring-red-200")}>
                                    <div className="flex justify-between items-start">
                                        <div onClick={() => prepareEdit(dest)} className="flex-1">
                                            <p className="font-bold text-gray-800">{dest.name}</p>
                                            <p className="text-gray-500 text-xs line-clamp-1">{dest.description}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteDestination(dest.id); }}>
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* FORM SIDE (Right) */}
                <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">{editingDestId ? "Edit Destination" : "Add New Destination"}</h3>
                        {editingDestId && (
                            <Button variant="ghost" size="sm" onClick={() => { setEditingDestId(null); setDestForm({name:"", description:"", location: location || "nagoya"}); }}>
                                <Plus className="w-3 h-3 mr-1" /> New
                            </Button>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Region</label>
                            <select
                                className="w-full mt-1 p-2 border rounded-md text-sm bg-white"
                                value={destForm.location}
                                onChange={(e) => setDestForm({...destForm, location: e.target.value})}
                            >
                                <option value="nagoya">Nagoya</option>
                                <option value="hakone">Hakone</option>
                                <option value="nara">Nara</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Place Name</label>
                            <Input 
                                value={destForm.name}
                                onChange={(e) => setDestForm({...destForm, name: e.target.value})}
                                placeholder="e.g. Kyoto Tower"
                                className="mt-1 bg-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                            <Textarea 
                                className="w-full min-h-[100px] mt-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                value={destForm.description}
                                onChange={(e) => setDestForm({...destForm, description: e.target.value})}
                                placeholder="Brief description..."
                            />
                        </div>
                        <Button onClick={handleSaveDestination} disabled={isSavingDest} className="w-full bg-red-600 hover:bg-red-700 mt-2">
                            {isSavingDest ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> {editingDestId ? "Update Place" : "Add Place"}</>
                            )}
                        </Button>
                    </div>
                </div>

            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}