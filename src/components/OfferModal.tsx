import { Dialog, DialogContent } from "./ui/dialog"; 
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { X, ArrowRight, MapPin, CheckCircle, Calendar, Users, Heart } from "lucide-react"; 
import { TourPackage } from "../types/travel";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; 

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: TourPackage | null; 
}

const TIERED_PRICING: Record<string, { tier1: number; tier2: number }> = {
  "tokyo-disney": { tier1: 60000, tier2: 80000 },
  "nara-tour": { tier1: 85000, tier2: 105000 },
};
const FIXED_PRICE_IDS = ["fukuoka-tour", "fukui-tour", "hiroshima-tour"];

export default function OfferModal({ isOpen, onClose, offer }: OfferModalProps) {
  const navigate = useNavigate();
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  // 2. SAFETY FIX: Use 'offer?.price || 0' so it doesn't crash if offer is null
  const [calculatedPrice, setCalculatedPrice] = useState(offer?.price || 0);

  useEffect(() => {
    const checkStatus = async () => {
      if (!offer) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('tour_id', Number(offer.id))
        .single();

      setIsFavorite(!!data);
    };
    if (isOpen) checkStatus();
  }, [isOpen, offer]);

  useEffect(() => {
    if (isOpen && offer) {
      setDate("");
      setTravelers(1);
      setCalculatedPrice(offer.price);
    }
  }, [isOpen, offer]);

  useEffect(() => {
    if (!offer) return; 

    const packageId = (offer as any).slug || offer.id;
    let price = 0;
    
    if (TIERED_PRICING[packageId]) {
      const config = TIERED_PRICING[packageId];
      price = travelers <= 6 ? config.tier1 : config.tier2;
    } else if (FIXED_PRICE_IDS.includes(packageId)) {
      price = offer.price;
    } else {
      price = offer.price; 
    }
    setCalculatedPrice(price);
  }, [travelers, offer]);

  const toggleFavorite = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Please sign in to save favorites.");
        return;
    }

    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('tour_id', Number(offer?.id));
      setIsFavorite(false);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, tour_id: Number(offer?.id) });
      setIsFavorite(true);
    }
    window.dispatchEvent(new Event("favoritesUpdated"));
  };

  const handleProceed = () => {
    if (!offer) return; 
    
    if (!date) {
      alert("Please select a travel date first.");
      return;
    }

    const pkgId = (offer as any).slug || offer.id;

    navigate(
      `/payment?package=${pkgId}&date=${date}&travelers=${travelers}&price=${calculatedPrice}&name=Guest`
    );
  };

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header Image */}
        <div className="relative h-48 w-full flex-shrink-0 bg-gray-200">
          <img 
            src={offer.image} 
            alt={offer.title} 
            className="w-full h-full object-cover"
          />
          
          {/* Action Buttons Container (Updated to flex-row) */}
          <div className="absolute top-3 right-3 flex flex-row items-center gap-2">
              {/* Heart Icon (Side-by-side with X) */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                onClick={toggleFavorite}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-white"}`} />
              </Button>

              {/* Original Close Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
          </div>

          <div className="absolute bottom-3 left-4">
             <Badge className="bg-white/90 text-black hover:bg-white backdrop-blur-sm border-none text-sm px-3 py-1">
                {offer.duration}
             </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
           <h2 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h2>
           <p className="text-gray-600 mb-6">{offer.description}</p>

           <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                 <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-red-600" />
                        Destinations
                    </h3>
                    <ul className="space-y-2">
                       {offer.destinations.map((dest, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-start">
                             <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 mr-2" />
                             {dest}
                          </li>
                       ))}
                    </ul>
                 </div>

                 <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Inclusions
                    </h3>
                    <ul className="space-y-2">
                       {offer.inclusions?.map((inc, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center">
                             <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                             {inc}
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>

              {/* Right Column: Booking Form */}
              <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 h-fit">
                 <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Plan Your Trip</h3>
                 
                 <div className="space-y-4">
                    {/* Date Picker */}
                    <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block">Travel Date</label>
                       <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input 
                             type="date"
                             className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                             min={new Date().toISOString().split("T")[0]}
                             value={date}
                             onChange={(e) => setDate(e.target.value)}
                          />
                       </div>
                    </div>

                    {/* Travelers Counter */}
                    <div>
                       <label className="text-sm font-medium text-gray-700 mb-1 block">Travelers</label>
                       <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <select 
                             className="w-full pl-10 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-red-500 focus:outline-none bg-white appearance-none"
                             value={travelers}
                             onChange={(e) => setTravelers(parseInt(e.target.value))}
                          >
                             {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                                <option key={num} value={num}>{num} Person{num > 1 ? 's' : ''}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    {/* Price Summary */}
                    <div className="pt-4 mt-2 border-t">
                       <div className="flex justify-between items-end mb-1">
                          <span className="text-sm text-gray-600">Total Price</span>
                          <span className="text-2xl font-bold text-red-600">¥{calculatedPrice.toLocaleString()}</span>
                       </div>
                       <p className="text-xs text-gray-400 text-right">Includes taxes & fees</p>
                    </div>

                    <Button 
                       className="w-full bg-red-600 hover:bg-red-700 text-white mt-2"
                       onClick={handleProceed}
                       disabled={!date}
                    >
                       Proceed to Booking <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}