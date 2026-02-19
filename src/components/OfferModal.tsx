import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label"; 
import { Input } from "./ui/input"; 
import { Textarea } from "./ui/textarea"; 
import { Checkbox } from "./ui/checkbox"; 
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; 
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"; 
import { Calendar } from "./ui/calendar";
import { 
  X, ArrowRight, MapPin, CheckCircle, Calendar as CalendarIcon, 
  Users, Layers, ArrowLeft, Car, Plane, Info, AlertCircle, 
  Settings, Save, Trash2, Loader2, PlusCircle
} from "lucide-react";
import { TourPackage } from "../types/travel";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 
import { useIsAdmin } from "../hooks/useIsAdmin"; 
import { format, isBefore, startOfToday, isSameDay } from "date-fns";
import { cn } from "../lib/utils";

// --- CONFIGURATION ---
const PRICING_CONFIG: Record<string, { tier1: number; tier2: number }> = {
  nara: { tier1: 85000, tier2: 105000 },
  hakone: { tier1: 75000, tier2: 95000 },
  nagoya: { tier1: 85000, tier2: 105000 },
};
const MAX_TRAVELERS = 9;
const MIN_DESTINATIONS = 4;
const MAX_DESTINATIONS = 5;
const FULLY_BOOKED_DATES = [new Date(2025, 12, 25), new Date(2025, 12, 31)];
const DEFAULT_DESTINATIONS = [
  { id: "hasedera", name: "Hasedera Temple", description: "Temple with a massive wooden statue", location: "nara" },
  { id: "kotoku-in", name: "Kotoku-in", description: "The Great Buddha", location: "nara" },
];

const TIERED_PRICING: Record<string, { tier1: number; tier2: number }> = {
  "tokyo-disney": { tier1: 60000, tier2: 80000 },
  "nara-tour": { tier1: 85000, tier2: 105000 },
};
const FIXED_PRICE_IDS = ["fukuoka-tour", "fukui-tour", "hiroshima-tour"];

// --- TYPES ---
interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: TourPackage | null;
}

type CartItem = {
  id: string;
  location: string;
  date: Date;
  travelers: number;
  destinations: string[]; 
  transportation: string[];
  price: number;
};

export default function OfferModal({ isOpen, onClose, offer }: OfferModalProps) {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [viewMode, setViewMode] = useState<'offer' | 'custom'>('offer');

  // ==========================================
  // 1. OFFER MODE LOGIC
  // ==========================================
  const [offerDate, setOfferDate] = useState("");
  const [offerTravelers, setOfferTravelers] = useState(1);
  const [offerCalculatedPrice, setOfferCalculatedPrice] = useState(offer?.price || 0);

  useEffect(() => {
    if (isOpen && offer) {
      setViewMode('offer'); 
      setOfferDate("");
      setOfferTravelers(1);
      setOfferCalculatedPrice(offer.price);
      // Reset Custom State
      setCart([]);
      setLocation("");
      setCustomDate(undefined);
      setSelectedDestinations([]);
    }
  }, [isOpen, offer]);

  useEffect(() => {
    if (!offer) return;
    const packageId = (offer as any).slug || offer.id;
    let price = 0;
    if (TIERED_PRICING[packageId]) {
      const config = TIERED_PRICING[packageId];
      price = offerTravelers <= 6 ? config.tier1 : config.tier2;
    } else if (FIXED_PRICE_IDS.includes(packageId)) {
      price = offer.price;
    } else {
      price = offer.price;
    }
    setOfferCalculatedPrice(price);
  }, [offerTravelers, offer]);

  const handleOfferProceed = () => {
    if (!offer || !offerDate) {
      if (!offerDate) alert("Please select a travel date first.");
      return;
    }
    const pkgId = (offer as any).slug || offer.id;
    navigate(`/payment?packageId=${pkgId}&date=${offerDate}&travelers=${offerTravelers}&price=${offerCalculatedPrice}&name=Guest`);
  };

  // ==========================================
  // 2. CUSTOM TOUR MODE LOGIC
  // ==========================================
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customDate, setCustomDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>(["private-van"]); 
  const [customTravelers, setCustomTravelers] = useState(1);
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);

  // -- ADMIN STATE --
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSavingDest, setIsSavingDest] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [destForm, setDestForm] = useState({ name: "", description: "", location: "nagoya" });

  useEffect(() => {
    if (viewMode === 'custom') fetchDestinations();
  }, [viewMode]);

  const fetchDestinations = async () => {
    try {
      const { data, error } = await supabase.from('tour_destinations').select('*');
      if (!error && data && data.length > 0) setAllDestinations(data);
    } catch (err) { console.error("Unexpected error:", err); }
  };

  const filteredDestinations = useMemo(() => {
    if (!location) return [];
    return allDestinations.filter((dest) => dest.location === location);
  }, [location, allDestinations]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setSelectedDestinations([]); 
    setDestForm(prev => ({ ...prev, location: newLocation || "nagoya" }));
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfToday())) return true; 
    const inCart = cart.some(item => isSameDay(item.date, date));
    if (inCart) return true;
    return FULLY_BOOKED_DATES.some(blockedDate => isSameDay(date, blockedDate));
  };

  const transportationOptions = [
    { id: "private-van", label: "Private Van", icon: Car, price: 0, included: true, addon: false },
    { id: "airport-transfer", label: "Airport Transfer", icon: Plane, price: 8000, included: false, addon: true },
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

  const getCurrentPrice = () => {
    if (!location) return 0;
    const config = PRICING_CONFIG[location];
    if (!config) return 0;
    const base = customTravelers <= 6 ? config.tier1 : config.tier2;
    const transport = selectedTransportation.reduce((total, id) => {
      const t = transportationOptions.find((opt) => opt.id === id);
      return total + (t ? t.price : 0);
    }, 0);
    return base + transport;
  };
  
  const currentFormPrice = getCurrentPrice();
  const isCurrentFormValid = location && customDate && selectedDestinations.length >= MIN_DESTINATIONS;

  const addToCart = () => {
    if (!isCurrentFormValid || !customDate) return;

    const newItem: CartItem = {
        id: Math.random().toString(36).substr(2, 9),
        location,
        date: customDate,
        travelers: customTravelers,
        destinations: [...selectedDestinations],
        transportation: [...selectedTransportation],
        price: currentFormPrice
    };

    setCart([...cart, newItem]);
    setCustomDate(undefined);
    setSelectedDestinations([]);
    setSelectedTransportation(["private-van"]);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const handleFinalCheckout = () => {
    const cartData = encodeURIComponent(JSON.stringify(cart));
    navigate(`/payment?custom=true&cartData=${cartData}&totalPrice=${cartTotal}&name=Valued+Customer`);
  };

  const handleSaveDestination = async () => {
    if (!destForm.name || !destForm.location) {
        alert("Please provide a name and location.");
        return;
    }
    setIsSavingDest(true);
    try {
        if (editingDestId) {
            const { error } = await supabase.from('tour_destinations')
                .update({ name: destForm.name, description: destForm.description, location: destForm.location })
                .eq('id', editingDestId);
            if (error) throw error;
            alert("Destination updated!");
        } else {
            const id = destForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
            const { error } = await supabase.from('tour_destinations')
                .insert([{ id: id, name: destForm.name, description: destForm.description, location: destForm.location }]);
            if (error) throw error;
            alert("New destination added!");
        }
        fetchDestinations();
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

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={cn("bg-white rounded-xl shadow-2xl w-full flex flex-col transition-all duration-300", viewMode === 'custom' ? "max-w-7xl h-[95vh]" : "max-w-2xl max-h-[90vh]")}>
        
        {/* ================================================== */}
        {/* VIEW MODE: STANDARD OFFER */}
        {/* ================================================== */}
        {viewMode === 'offer' && (
           <>
            <div className="relative h-48 w-full flex-shrink-0 bg-gray-200">
              <img src={offer.image} alt={offer.title} className="w-full h-full object-cover" />
              <Button variant="ghost" size="icon" className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
              <div className="absolute bottom-3 left-4">
                 <Badge className="bg-white/90 text-black border-none text-sm px-3 py-1">{offer.duration}</Badge>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
               <h2 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h2>
               <p className="text-gray-600 mb-6">{offer.description}</p>

               <div className="grid md:grid-cols-2 gap-8">
                  {/* Left Column: Details */}
                  <div className="space-y-6">
                     <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MapPin className="w-4 h-4 mr-2 text-red-600" />Destinations
                        </h3>
                        <ul className="space-y-2">
                           {offer.destinations.map((dest, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-start">
                                 <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 mr-2" />{dest}
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div>
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />Inclusions
                        </h3>
                        <ul className="space-y-2">
                           {offer.inclusions?.map((inc, i) => (
                              <li key={i} className="text-sm text-gray-600 flex items-center">
                                 <CheckCircle className="w-3 h-3 mr-2 text-green-500" />{inc}
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>

                  {/* Right Column: Booking Form */}
                  <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 h-fit">
                     <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Plan Your Trip</h3>
                     <div className="space-y-4">
                        <div>
                           <label className="text-sm font-medium text-gray-700 mb-1 block">Travel Date</label>
                           <div className="relative">
                              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input type="date" className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-white" min={new Date().toISOString().split("T")[0]} value={offerDate} onChange={(e) => setOfferDate(e.target.value)} />
                           </div>
                        </div>

                        <div>
                           <label className="text-sm font-medium text-gray-700 mb-1 block">Travelers</label>
                           <div className="relative">
                              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <select className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-white appearance-none" value={offerTravelers} onChange={(e) => setOfferTravelers(parseInt(e.target.value))}>
                                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (<option key={num} value={num}>{num} Person{num > 1 ? 's' : ''}</option>))}
                              </select>
                           </div>
                        </div>

                        <div className="pt-4 mt-2 border-t">
                           <div className="flex justify-between items-end mb-1">
                              <span className="text-sm text-gray-600">Total Price</span>
                              <span className="text-2xl font-bold text-red-600">¥{offerCalculatedPrice.toLocaleString()}</span>
                           </div>
                           <p className="text-xs text-gray-400 text-right">Includes taxes & fees</p>
                        </div>

                        <div className="flex flex-col gap-2 mt-4">
                          <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600" onClick={() => setViewMode('custom')}>
                              <Layers className="w-4 h-4 mr-2" />Book multiple tours or dates
                          </Button>
                          <Button className="w-full bg-red-600 hover:bg-red-700 text-white" onClick={handleOfferProceed} disabled={!offerDate}>
                              Proceed to Booking <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
           </>
        )}

        {/* ================================================== */}
        {/* VIEW MODE: CUSTOM TOUR BUILDER (CART) */}
        {/* ================================================== */}
        {viewMode === 'custom' && (
           <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-gray-50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                     <Button variant="ghost" size="sm" onClick={() => setViewMode('offer')} className="mr-2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Offer
                     </Button>
                     <div>
                        <h2 className="text-xl font-bold text-gray-900">Build Your Itinerary</h2>
                        <p className="text-xs text-gray-500">Add multiple days to create a full trip package</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
              </div>

              {/* Content Grid */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
                  <div className="grid lg:grid-cols-12 gap-6 h-full">
                      
                      {/* LEFT COLUMN: BUILDER (8 cols) */}
                      <div className="lg:col-span-8 space-y-6">
                        
                        {/* 1. Location & Date Form */}
                        <Card className="shadow-sm">
                            <CardHeader className="py-4 border-b bg-gray-50/30">
                                <CardTitle className="text-base font-bold text-gray-800">1. Location & Date</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Region</Label>
                                    <select value={location} onChange={handleLocationChange} className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-red-500 focus:outline-none">
                                        <option value="">Select Region...</option>
                                        <option value="nagoya">Nagoya</option>
                                        <option value="hakone">Hakone</option>
                                        <option value="nara">Nara</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs text-gray-500 uppercase tracking-wide">Date & Travelers</Label>
                                    <div className="flex gap-2">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />{customDate ? format(customDate, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customDate} onSelect={setCustomDate} disabled={isDateDisabled} initialFocus /></PopoverContent>
                                        </Popover>
                                        <div className="flex items-center border rounded-md px-2 bg-white">
                                             <Users className="w-4 h-4 text-gray-400 mr-2"/>
                                             <select 
                                                className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer py-1"
                                                value={customTravelers}
                                                onChange={(e) => setCustomTravelers(parseInt(e.target.value))}
                                             >
                                                {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
                                             </select>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Destinations Selection */}
                        <Card className="flex-1 shadow-sm">
                             <CardHeader className="py-4 bg-gray-50/30 border-b flex flex-row justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-base font-bold text-gray-800">2. Select Destinations</CardTitle>
                                    <Badge variant={selectedDestinations.length >= 4 ? "default" : "outline"} className={selectedDestinations.length >= 4 ? "bg-green-600 hover:bg-green-700" : ""}>
                                        {selectedDestinations.length}/5 Selected
                                    </Badge>
                                </div>
                                {isAdmin && (
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:bg-red-50" onClick={() => setIsDestModalOpen(true)}>
                                        <Settings className="w-3 h-3 mr-1" /> Manage
                                    </Button>
                                )}
                             </CardHeader>
                             
                             <CardContent className="p-6">
                                {!location ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">Please select a region in Step 1</p>
                                        <p className="text-xs text-gray-400">Available destinations will appear here</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {filteredDestinations.map((dest) => {
                                            const isSelected = selectedDestinations.includes(dest.id);
                                            const isDisabled = !isSelected && selectedDestinations.length >= MAX_DESTINATIONS;
                                            return (
                                                <div key={dest.id} className={cn("flex items-start space-x-3 p-3 border rounded-lg transition-all cursor-pointer group", isSelected ? "border-red-500 bg-red-50/50" : "hover:border-gray-300 hover:bg-gray-50", isDisabled && "opacity-50 grayscale")} onClick={() => !isDisabled && handleDestinationChange(dest.id, !isSelected)}>
                                                    <div className={cn("mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors", isSelected ? "bg-red-600 border-red-600" : "border-gray-300 bg-white")}>
                                                        {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={cn("font-bold text-sm", isSelected ? "text-red-900" : "text-gray-700")}>{dest.name}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{dest.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                             </CardContent>

                             {/* --- ADD-ONS SECTION (Moved to Bottom) --- */}
                             {location && (
                                 <div className="px-6 py-4 bg-gray-50 border-t border-b">
                                     <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                         <PlusCircle className="w-4 h-4 mr-2 text-gray-400"/>
                                         Optional Add-ons
                                     </h4>
                                     <div className="flex flex-wrap gap-4">
                                        {transportationOptions.map((t) => (
                                            <div key={t.id} className={cn("flex items-center space-x-2 bg-white px-3 py-2 rounded border transition-colors", (t.included || selectedTransportation.includes(t.id)) ? "border-gray-400" : "border-gray-200")}>
                                                <Checkbox id={t.id} checked={t.included || selectedTransportation.includes(t.id)} disabled={t.included} onCheckedChange={(c) => !t.included && handleTransportationChange(t.id, c as boolean)} />
                                                
                                                <t.icon className={cn("w-4 h-4", t.included ? "text-green-600" : "text-gray-500")} />
                                                
                                                <Label htmlFor={t.id} className="text-sm cursor-pointer">{t.label}</Label>
                                                {t.price > 0 && <span className="text-xs font-bold text-gray-500 ml-1">+¥{t.price.toLocaleString()}</span>}
                                            </div>
                                        ))}
                                     </div>
                                 </div>
                             )}

                             {/* FOOTER ACTIONS */}
                             <div className="p-6 bg-white flex justify-between items-center rounded-b-xl">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Estimated Day Price</p>
                                    <p className="text-2xl font-bold text-red-600">¥{currentFormPrice.toLocaleString()}</p>
                                </div>
                                <Button size="lg" onClick={addToCart} disabled={!isCurrentFormValid} className="bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl transition-all">
                                    <PlusCircle className="w-5 h-5 mr-2" /> Add Day to Trip
                                </Button>
                             </div>
                        </Card>
                      </div>

                      {/* RIGHT COLUMN: CHOSEN TRIPS (4 cols) */}
                      <div className="lg:col-span-4 flex flex-col h-full">
                         <Card className="sticky top-0 shadow-lg border-t-4 border-t-red-600 flex flex-col h-full max-h-[calc(100vh-120px)]">
                            <CardHeader className="py-4 border-b bg-white z-10">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-red-600"/> Chosen Trips
                                </CardTitle>
                            </CardHeader>
                            
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 space-y-2">
                                        <div className="bg-white p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center shadow-sm">
                                            <AlertCircle className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-600">Your trip is currently empty</p>
                                        <p className="text-xs">Configure a day on the left and click "Add Day to Trip".</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item, index) => (
                                            <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm relative group hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-[10px] font-bold text-white bg-gray-800 px-2 py-0.5 rounded-full uppercase tracking-wider">Day {index + 1}</span>
                                                        <h4 className="font-bold text-gray-800 mt-2 text-lg leading-tight">{item.location.toUpperCase()}</h4>
                                                        
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                                <CalendarIcon className="w-3 h-3 mr-1" />
                                                                {format(item.date, "MMM dd, yyyy")}
                                                            </div>
                                                            {/* --- TRAVELER COUNT --- */}
                                                            <div className="flex items-center text-xs text-gray-500 font-medium">
                                                                <Users className="w-3 h-3 mr-1" />
                                                                {item.travelers} Traveler{item.travelers > 1 ? 's' : ''}
                                                            </div>
                                                        </div>

                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-300 hover:text-red-500 hover:bg-red-50" onClick={() => removeFromCart(item.id)}>
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                                
                                                {/* LIST OF DESTINATIONS & ADD-ONS */}
                                                <div className="text-xs text-gray-500 border-t pt-2 mt-2 bg-gray-50/50 -mx-3 px-3 pb-1">
                                                    <p className="font-semibold mb-1 text-gray-700">Selected Destinations:</p>
                                                    <ul className="list-disc pl-4 space-y-0.5 mb-2">
                                                        {item.destinations.map(destId => {
                                                            const destName = allDestinations.find(d => d.id === destId)?.name || destId;
                                                            return <li key={destId}>{destName}</li>
                                                        })}
                                                        {item.transportation.includes("airport-transfer") && (
                                                            <li className="text-blue-600 font-medium flex items-center -ml-1">
                                                                <Plane className="w-3 h-3 mr-1" /> Airport Transfer (+¥8,000)
                                                            </li>
                                                        )}
                                                    </ul>
                                                    <div className="flex justify-between items-end border-t border-dashed pt-2 mt-2">
                                                        <span className="text-gray-400">Day Total</span>
                                                        <span className="font-bold text-red-600">¥{item.price.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                            
                            <div className="p-4 border-t bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-sm text-gray-600 font-medium">Total Trip Price</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-red-600">¥{cartTotal.toLocaleString()}</span>
                                        <p className="text-xs text-gray-400">Tax included</p>
                                    </div>
                                </div>
                                <Button 
                                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-md shadow-md"
                                    disabled={cart.length === 0}
                                    onClick={handleFinalCheckout}
                                >
                                    Proceed to Payment <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                         </Card>
                      </div>
                  </div>
              </div>

               {/* INNER ADMIN MODAL FOR LOCATIONS */}
              {isDestModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
                   <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                      <CardHeader className="flex flex-row items-center justify-between py-3 border-b bg-gray-50">
                         <CardTitle className="text-base">Manage {location ? location.toUpperCase() : "All"} Destinations</CardTitle>
                         <Button variant="ghost" size="sm" onClick={() => setIsDestModalOpen(false)}><X className="w-4 h-4"/></Button>
                      </CardHeader>
                      <CardContent className="flex flex-1 overflow-hidden p-0">
                         {/* List */}
                         <div className="w-1/2 border-r overflow-y-auto p-3 space-y-2">
                            {filteredDestinations.map(dest => (
                                <div key={dest.id} onClick={() => prepareEdit(dest)} className={cn("p-2 border rounded text-sm cursor-pointer hover:bg-gray-50", editingDestId === dest.id && "border-red-500 bg-red-50")}>
                                    <div className="flex justify-between">
                                        <span className="font-bold">{dest.name}</span>
                                        <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600" onClick={(e) => {e.stopPropagation(); handleDeleteDestination(dest.id)}}/>
                                    </div>
                                </div>
                            ))}
                         </div>
                         {/* Form */}
                         <div className="w-1/2 p-4 bg-gray-50 space-y-3">
                             <h4 className="font-bold text-sm">{editingDestId ? "Edit" : "Add New"}</h4>
                             <Input placeholder="Name" value={destForm.name} onChange={e => setDestForm({...destForm, name: e.target.value})} className="bg-white"/>
                             <Textarea placeholder="Desc" value={destForm.description} onChange={e => setDestForm({...destForm, description: e.target.value})} className="bg-white h-20"/>
                             <Button size="sm" className="w-full bg-red-600" onClick={handleSaveDestination} disabled={isSavingDest}>
                                {isSavingDest ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3 mr-2"/>} Save
                             </Button>
                         </div>
                      </CardContent>
                   </Card>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}