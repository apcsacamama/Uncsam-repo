import { TourPackage } from "../types/travel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, MapPin, Clock, Check, Users, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

interface OfferModalProps {
  offer: TourPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

// --- PRICING CONFIGURATION ---
// Tier 1: 1-6 Travelers | Tier 2: 7-9 Travelers
const TIERED_PRICING: Record<string, { tier1: number; tier2: number }> = {
  "nara-tour": { tier1: 85000, tier2: 105000 },
  "tokyo-disney": { tier1: 60000, tier2: 80000 },
};

// Fixed price packages (Flat rate regardless of travelers up to max)
const FIXED_PRICE_IDS = ["fukuoka-tour", "fukui-tour", "hiroshima-tour"];

export default function OfferModal({
  offer,
  isOpen,
  onClose,
}: OfferModalProps) {
  const [travelers, setTravelers] = useState(1);

  // Reset traveler count when the modal opens or offer changes
  useEffect(() => {
    if (isOpen) {
      setTravelers(1);
    }
  }, [isOpen, offer]);

  if (!offer) return null;

  // --- PRICING LOGIC ---
  let totalPrice = 0;
  let pricingType: "tiered" | "fixed" | "per-person" = "per-person";

  // Check 1: Is it a Tiered Package? (Tokyo / Nara)
  if (TIERED_PRICING[offer.id]) {
    pricingType = "tiered";
    const config = TIERED_PRICING[offer.id];
    if (travelers <= 6) {
      totalPrice = config.tier1;
    } else {
      totalPrice = config.tier2;
    }
  } 
  // Check 2: Is it a Fixed Price Package? (Fukuoka / Fukui / Hiroshima)
  else if (FIXED_PRICE_IDS.includes(offer.id)) {
    pricingType = "fixed";
    totalPrice = offer.price; // Flat rate from data file
  } 
  // Check 3: Default Fallback (Per Person)
  else {
    totalPrice = offer.price * travelers;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-xl">
        
        {/* Header */}
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
            {offer.title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* LEFT COLUMN: Image & Description */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl shadow-sm">
              <img
                src={offer.image}
                alt={offer.title}
                className="w-full h-64 object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-500" />
                {offer.duration}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-red-500" />
                {offer.destinations.length} destinations
              </div>
            </div>

            <div className="prose prose-sm text-gray-600">
              <p>{offer.description}</p>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Booking */}
          <div className="space-y-6">
            
            {/* Destinations List */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-red-600" />
                Destinations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {offer.destinations.map((destination, index) => (
                  <div
                    key={index}
                    className="flex items-start text-sm text-gray-600 bg-gray-50 p-2 rounded"
                  >
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {destination}
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions List */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <Check className="w-5 h-5 mr-2 text-green-600" />
                What's Included
              </h3>
              <ul className="space-y-2">
                {offer.inclusions.map((inclusion, index) => (
                  <li
                    key={index}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <Check className="w-4 h-4 mr-2 text-green-500 flex-shrink-0" />
                    {inclusion}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-gray-200 my-4"></div>

            {/* Travelers Selection & Price Calculation */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Configure Booking
              </h3>
              
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-700 font-medium">Travelers</span>
                <div className="flex items-center space-x-3 bg-white px-2 py-1 rounded-lg border border-gray-200">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                    onClick={() => setTravelers(Math.max(1, travelers - 1))}
                    disabled={travelers <= 1}
                  >
                    -
                  </Button>
                  <span className="text-lg font-bold w-6 text-center">
                    {travelers}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                    onClick={() => setTravelers(travelers + 1)}
                    disabled={travelers >= 9}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Dynamic Info Text */}
              <div className="mb-4 min-h-[1.5rem]">
                {pricingType === "tiered" && (
                  <p className="text-xs text-blue-600 flex items-center justify-end">
                    <Info className="w-3 h-3 mr-1" />
                    Tier: {travelers <= 6 ? "1-6 Travelers" : "7-9 Travelers"}
                  </p>
                )}
                {pricingType === "fixed" && (
                  <p className="text-xs text-green-600 flex items-center justify-end">
                    <Info className="w-3 h-3 mr-1" />
                    Flat rate (up to 9 pax)
                  </p>
                )}
              </div>

              {/* Total Price Display */}
              <div className="flex justify-between items-end border-t border-gray-200 pt-4 mb-6">
                <div className="text-sm text-gray-500">Total Price</div>
                <div className="text-3xl font-bold text-red-600">
                  ¥{totalPrice.toLocaleString()}
                </div>
              </div>

              {/* Action Button */}
              <Link
                to={`/payment?location=${encodeURIComponent(offer.title)}&price=${totalPrice}&travelers=${travelers}&package=${offer.id}`}
                className="block"
              >
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg rounded-lg shadow-md hover:shadow-lg transition-all"
                  onClick={onClose}
                >
                  Proceed to Booking
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
