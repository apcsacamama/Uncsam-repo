import { TourPackage } from "../types/travel";
import { Button } from "./ui/button";
import { Clock, MapPin, Users } from "lucide-react";

interface OfferCardProps {
  offer: TourPackage;
  onViewDetails: (offer: TourPackage) => void;
}

export default function OfferCard({ offer, onViewDetails }: OfferCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={offer.image}
          alt={offer.title}
          className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
        />
        {offer.featured && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
            FEATURED
          </div>
        )}
        {offer.originalPrice && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
            SAVE ¥{(offer.originalPrice - offer.price).toLocaleString()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{offer.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{offer.description}</p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="w-4 h-4 mr-2" />
            {offer.duration}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-2" />
            {offer.destinations.length} destinations
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {offer.originalPrice && (
              <span className="text-sm text-gray-400 line-through mr-2">
                ¥{offer.originalPrice.toLocaleString()}
              </span>
            )}
            <span className="text-2xl font-bold text-red-600">
              ¥{offer.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500 ml-1">per person</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onViewDetails(offer)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200"
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
