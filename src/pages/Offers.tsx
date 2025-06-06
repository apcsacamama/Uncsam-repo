import Navigation from "../components/Navigation";
import OfferCard from "../components/OfferCard";
import OfferModal from "../components/OfferModal";
import FAQChatbot from "../components/FAQChatbot";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { tourPackages } from "../data/offers";
import { TourPackage } from "../types/travel";
import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

export default function Offers() {
  const [selectedOffer, setSelectedOffer] = useState<TourPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "title" | "duration">("title");

  const handleViewDetails = (offer: TourPackage) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  // Filter and sort offers
  const filteredOffers = tourPackages
    .filter(
      (offer) =>
        offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.destinations.some((dest) =>
          dest.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price":
          return a.price - b.price;
        case "duration":
          return a.duration.localeCompare(b.duration);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Exclusive Deals and Offers
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover amazing travel packages at unbeatable prices
          </p>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search by destination or package name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "price" | "title" | "duration")
                }
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="title">Sort by Name</option>
                <option value="price">Sort by Price</option>
                <option value="duration">Sort by Duration</option>
              </select>

              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <p className="text-gray-600">
          Found {filteredOffers.length}{" "}
          {filteredOffers.length === 1 ? "offer" : "offers"}
          {searchTerm && ` for "${searchTerm}"`}
        </p>
      </div>

      {/* Offers Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {filteredOffers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No offers found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or browse all available offers
            </p>
            <Button
              onClick={() => setSearchTerm("")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      <OfferModal
        offer={selectedOffer}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <FAQChatbot />
    </div>
  );
}
