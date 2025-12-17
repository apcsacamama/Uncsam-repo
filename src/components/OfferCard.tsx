import { TourPackage } from "../types/travel";
import { Button } from "./ui/button";
import { Clock, MapPin, Users } from "lucide-react";

interface OfferCardProps {
  offer: TourPackage;
  onViewDetails: (offer: TourPackage) => void;
}

export default function OfferCard({ offer, onViewDetails }: OfferCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden h-48">
        <img
          src={offer.image}
          alt={offer.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        {offer.featured && (
          <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
            FEATURED
          </div>
        )}
        {offer.originalPrice && (
          <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold shadow-sm">
            SAVE ¥{(offer.originalPrice - offer.price).toLocaleString()}
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4 flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
            {offer.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {offer.description}
          </p>
        </div>

        {/* Key Details (Grid Layout for better alignment) */}
        <div className="grid grid-cols-2 gap-y-2 mb-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-red-500" />
            {offer.duration}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-red-500" />
            {offer.destinations.length} Stops
          </div>
          {/* Added Users Icon to indicate Private Group */}
          <div className="flex items-center col-span-2">
            <Users className="w-4 h-4 mr-2 text-red-500" />
            Private Group / Transfer
          </div>
        </div>

        <div className="mt-auto">
          {/* Price Section */}
          <div className="flex items-end justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                Total Price
              </span>
              <div className="flex items-baseline">
                {offer.originalPrice && (
                  <span className="text-sm text-gray-400 line-through mr-2">
                    ¥{offer.originalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-2xl font-bold text-red-600">
                  ¥{offer.price.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500 ml-1 font-medium">
                  / group
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => onViewDetails(offer)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
