import { TourPackage } from "../types/travel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, MapPin, Clock, Check } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface OfferModalProps {
  offer: TourPackage | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function OfferModal({
  offer,
  isOpen,
  onClose,
}: OfferModalProps) {
  const [travelers, setTravelers] = useState(1);

  if (!offer) return null;

  const totalPrice = offer.price * travelers;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {offer.title}
          </DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="space-y-4">
            <img
              src={offer.image}
              alt={offer.title}
              className="w-full h-64 object-cover rounded-lg"
            />

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {offer.duration}
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {offer.destinations.length} destinations
              </div>
            </div>

            <p className="text-gray-700">{offer.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Destinations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Destinations
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {offer.destinations.map((destination, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <MapPin className="w-3 h-3 mr-2 text-red-600" />
                    {destination}
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Inclusions
              </h3>
              <div className="space-y-2">
                {offer.inclusions.map((inclusion, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-600"
                  >
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    {inclusion}
                  </div>
                ))}
              </div>
            </div>

            {/* Travelers Selection */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Number of Travelers
              </h3>
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
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per pax:</span>
                <span className="font-medium">
                  ¥{offer.price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Travelers:</span>
                <span className="font-medium">{travelers}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-red-600">
                    ¥{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Button */}
            <Link
              to={`/booking-confirmation?package=${offer.id}&travelers=${travelers}`}
            >
              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 text-lg rounded-lg"
                onClick={onClose}
              >
                Get Tickets for ¥{totalPrice.toLocaleString()}
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
