import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Label } from "./ui/label"; // Imported from CustomTour
import { Input } from "./ui/input"; // Imported from CustomTour
import { Textarea } from "./ui/textarea"; // Imported from CustomTour
import { Checkbox } from "./ui/checkbox"; // Imported from CustomTour
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"; // Imported from CustomTour
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"; // Imported from CustomTour
import { Calendar } from "./ui/calendar";
import { 
  X, ArrowRight, MapPin, CheckCircle, Calendar as CalendarIcon, 
  Users, Layers, ArrowLeft, Car, Plane, Info, AlertCircle, 
  Settings, Plus, Save, Trash2, Loader2 
} from "lucide-react";
import { TourPackage } from "../types/travel";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // Ensure this exists
import { useIsAdmin } from "../hooks/useIsAdmin"; // Ensure this exists
import { format, isBefore, startOfToday, isSameDay } from "date-fns";
import { cn } from "../lib/utils";

// --- CUSTOM TOUR CONFIGURATION ---
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

// --- OFFER MODAL CONFIGURATION ---
const TIERED_PRICING: Record<string, { tier1: number; tier2: number }> = {
  "tokyo-disney": { tier1: 60000, tier2: 80000 },
  "nara-tour": { tier1: 85000, tier2: 105000 },
};
const FIXED_PRICE_IDS = ["fukuoka-tour", "fukui-tour", "hiroshima-tour"];

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: TourPackage | null;
}

export default function OfferModal({ isOpen, onClose, offer }: OfferModalProps) {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  // --- VIEW MODE STATE ---
  // 'offer' = The standard single package view
  // 'custom' = The complex custom tour builder view
  const [viewMode, setViewMode] = useState<'offer' | 'custom'>('offer');

  // ==========================================
  // 1. OFFER MODE LOGIC
  // ==========================================
  const [offerDate, setOfferDate] = useState("");
  const [offerTravelers, setOfferTravelers] = useState(1);
  const [offerCalculatedPrice, setOfferCalculatedPrice] = useState(offer?.price || 0);

  useEffect(() => {
    if (isOpen && offer) {
      // Reset logic when modal opens
      setViewMode('offer'); 
      setOfferDate("");
      setOfferTravelers(1);
      setOfferCalculatedPrice(offer.price);
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
    navigate(`/payment?package=${pkgId}&date=${offerDate}&travelers=${offerTravelers}&price=${offerCalculatedPrice}&name=Guest`);
  };

  // ==========================================
  // 2. CUSTOM TOUR MODE LOGIC
  // ==========================================
  const [customDate, setCustomDate] = useState<Date>();
  const [location, setLocation] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>(["private-van"]); 
  const [customTravelers, setCustomTravelers] = useState(1);
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);

  // Admin Custom Tour State
  const [isDestModalOpen, setIsDestModalOpen] = useState(false);
  const [isSavingDest, setIsSavingDest] = useState(false);
  const [editingDestId, setEditingDestId] = useState<string | null>(null);
  const [destForm, setDestForm] = useState({ name: "", description: "", location: "nagoya" });

  useEffect(() => {
    if (viewMode === 'custom') {
        fetchDestinations();
    }
  }, [viewMode]);

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

  const filteredDestinations = useMemo(() => {
    if (!location) return [];
    return allDestinations.filter((dest) => dest.location === location);
  }, [location, allDestinations]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    setSelectedDestinations([]); 
    setCustomTravelers(1); 
    setDestForm(prev => ({ ...prev, location: newLocation || "nagoya" }));
  };

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, startOfToday())) return true; 
    const isFullyBooked = FULLY_BOOKED_DATES.some(blockedDate => isSameDay(date, blockedDate));
    return !!isFullyBooked;
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

  // --- ADMIN HANDLERS ---
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

  // --- CUSTOM PRICING ---
  const getPackagePrice = () => {
    if (!location) return 0;
    const config = PRICING_CONFIG[location];
    if (!config) return 0;
    if (customTravelers <= 6) return config.tier1;
    else if (customTravelers <= 9) return config.tier2;
    return 0;
  };

  const basePrice = getPackagePrice();
  const transportationPriceTotal = selectedTransportation.reduce((total, transportId) => {
      const transport = transportationOptions.find((t) => t.id === transportId);
      return total + (transport ? transport.price : 0); 
    }, 0);
  const customTotalPrice = basePrice + transportationPriceTotal;
  const isDestinationCountValid = selectedDestinations.length >= MIN_DESTINATIONS && selectedDestinations.length <= MAX_DESTINATIONS;
  const isCustomFormValid = location && customDate && isDestinationCountValid;
  const addonsString = selectedTransportation.filter(t => t !== 'private-van').join(',');

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* DYNAMIC WIDTH CONTAINER */}
      <div className={cn(
          "bg-white rounded-xl shadow-2xl w-full flex flex-col transition-all duration-300",
          viewMode === 'custom' ? "max-w-6xl h-[95vh]" : "max-w-2xl max-h-[90vh]"
      )}>
        
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
                          {/* SWITCH TO CUSTOM MODE */}
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
        {/* VIEW MODE: CUSTOM TOUR BUILDER */}
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
                        <h2 className="text-xl font-bold text-gray-900">Create Your Own Experience</h2>
                        <p className="text-xs text-gray-500">Customize destinations, dates, and transport</p>
                     </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
                  <div className="grid lg:grid-cols-3 gap-6 h-full">
                      {/* LEFT COLUMN: FORM */}
                      <div className="lg:col-span-2 space-y-6">
                        {/* 1. Location & Date */}
                        <Card>
                            <CardHeader className="py-4"><CardTitle className="text-lg flex items-center gap-2"><MapPin className="w-4 h-4 text-red-600"/> Location & Date</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Select Location</Label>
                                    <select value={location} onChange={handleLocationChange} className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
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
                                                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !customDate && "text-muted-foreground")}>
                                                    <CalendarIcon className="mr-2 h-4 w-4" />{customDate ? format(customDate, "PPP") : "Pick a date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={customDate} onSelect={setCustomDate} disabled={isDateDisabled} initialFocus /></PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Travelers</Label>
                                        <div className="flex items-center space-x-3">
                                            <Button variant="outline" size="sm" onClick={() => setCustomTravelers(Math.max(1, customTravelers - 1))} disabled={customTravelers <= 1}>-</Button>
                                            <span className="text-lg font-medium w-8 text-center">{customTravelers}</span>
                                            <Button variant="outline" size="sm" onClick={() => setCustomTravelers(customTravelers + 1)} disabled={customTravelers >= MAX_TRAVELERS}>+</Button>
                                            <Users className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Choose Destinations */}
                        <Card className="flex-1">
                             <CardHeader className="py-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">Choose Destinations</CardTitle>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-xs font-medium", selectedDestinations.length >= MIN_DESTINATIONS && selectedDestinations.length <= MAX_DESTINATIONS ? "text-green-600" : "text-gray-500")}>
                                            {selectedDestinations.length} / {MAX_DESTINATIONS} selected
                                        </span>
                                        {isAdmin && (
                                            <Button size="sm" variant="outline" className="h-7 text-xs border-red-200 text-red-600 bg-red-50" onClick={() => setIsDestModalOpen(true)}>
                                                <Settings className="w-3 h-3 mr-1" /> Manage
                                            </Button>
                                        )}
                                    </div>
                                </div>
                             </CardHeader>
                             <CardContent>
                                {!location ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed text-sm">Please select a location above first.</div>
                                ) : (
                                    <div className="grid md:grid-cols-2 gap-3">
                                        {filteredDestinations.map((dest) => {
                                            const isSelected = selectedDestinations.includes(dest.id);
                                            const isDisabled = !isSelected && selectedDestinations.length >= MAX_DESTINATIONS;
                                            return (
                                                <div key={dest.id} className={cn("flex items-start space-x-3 p-3 border rounded-lg transition-colors", isSelected ? "border-red-500 bg-red-50" : "hover:bg-gray-50", isDisabled && "opacity-50 cursor-not-allowed")}>
                                                    <Checkbox id={dest.id} checked={isSelected} disabled={isDisabled} onCheckedChange={(checked) => handleDestinationChange(dest.id, checked as boolean)} />
                                                    <div>
                                                        <Label htmlFor={dest.id} className="font-medium cursor-pointer">{dest.name}</Label>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{dest.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                             </CardContent>
                        </Card>

                        {/* 3. Transport */}
                        <Card>
                            <CardHeader className="py-4"><CardTitle className="text-lg">Transport Options</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {transportationOptions.map((t) => (
                                        <div key={t.id} className={cn("flex items-center space-x-3 p-3 border rounded-lg", t.included ? "bg-green-50 border-green-200" : "hover:bg-gray-50")}>
                                            <Checkbox id={t.id} checked={t.included || selectedTransportation.includes(t.id)} disabled={t.included} onCheckedChange={(c) => !t.included && handleTransportationChange(t.id, c as boolean)} />
                                            <t.icon className={cn("w-5 h-5", t.included ? "text-green-600" : "text-gray-600")} />
                                            <div className="flex-1 flex justify-between items-center">
                                                <Label className="text-sm font-medium">{t.label}</Label>
                                                <span className={cn("text-xs font-bold", t.price === 0 ? "text-green-600" : "text-gray-700")}>{t.price === 0 ? "Included" : `+¥${t.price.toLocaleString()}`}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                      </div>

                      {/* RIGHT COLUMN: SUMMARY */}
                      <div className="lg:col-span-1">
                         <Card className="sticky top-0 shadow-lg border-t-4 border-t-red-600">
                            <CardHeader className="py-4"><CardTitle className="text-lg">Tour Summary</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-gray-50 p-3 rounded-md border border-gray-100 space-y-2">
                                    <div className="flex justify-between text-sm"><span>Base Price:</span> <span className="font-semibold">{basePrice > 0 ? `¥${basePrice.toLocaleString()}` : "---"}</span></div>
                                    {transportationPriceTotal > 0 && <div className="flex justify-between text-sm text-blue-600"><span>Add-ons:</span> <span>+¥{transportationPriceTotal.toLocaleString()}</span></div>}
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total:</span> <span className="text-red-600">¥{customTotalPrice.toLocaleString()}</span></div>
                                </div>
                                
                                {selectedDestinations.length > 0 && (
                                    <div className="text-xs text-gray-600 border-t pt-2">
                                        <p className="font-semibold mb-1">Selected Places:</p>
                                        <ul className="space-y-1">{selectedDestinations.map(id => <li key={id}>• {allDestinations.find(d => d.id === id)?.name}</li>)}</ul>
                                    </div>
                                )}

                                <Button 
                                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-md"
                                    disabled={!isCustomFormValid}
                                    onClick={() => navigate(`/payment?package=custom-${location}&location=${location}&custom=true&date=${customDate ? format(customDate, "yyyy-MM-dd") : ""}&travelers=${customTravelers}&price=${customTotalPrice}&addons=${addonsString}&name=Valued+Customer`)}
                                >
                                    {basePrice > 0 ? `Book Custom Tour` : "Select Details"}
                                </Button>
                                
                                {!isCustomFormValid && (
                                    <div className="text-xs text-red-500 space-y-1 bg-red-50 p-2 rounded">
                                        {!location && <p>• Select a location</p>}
                                        {!customDate && <p>• Pick a date</p>}
                                        {selectedDestinations.length < MIN_DESTINATIONS && <p>• Select at least {MIN_DESTINATIONS} places</p>}
                                    </div>
                                )}
                            </CardContent>
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