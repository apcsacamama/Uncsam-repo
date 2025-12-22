import HeroSection from "../components/HeroSection";
import OfferCard from "../components/OfferCard";
import FAQChatbot from "../components/FAQChatbot";
import { tourPackages } from "../data/offers";
import { TourPackage } from "../types/travel";
import OfferModal from "../components/OfferModal";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Landing() {
  const [selectedOffer, setSelectedOffer] = useState<TourPackage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const featuredOffers = tourPackages
    .filter((offer) => offer.featured)
    .slice(0, 3);

  const handleViewDetails = (offer: TourPackage) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />

      {/* Featured Offers Section */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Featured Experiences
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our handpicked selection of exclusive travel packages
            designed to create unforgettable memories
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredOffers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              onBookNow={() => handleViewDetails(offer)}
            />
          ))}
        </div>

        <div className="text-center">
          <Link to="/offers">
            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium"
            >
              View All Offers
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Uncle Sam Travel?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Expert Planning
              </h3>
              <p className="text-gray-600">
                Our experienced team crafts personalized itineraries to match
                your preferences and budget
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Best Value
              </h3>
              <p className="text-gray-600">
                Competitive prices with no hidden fees, plus exclusive deals you
                won't find elsewhere
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                24/7 Support
              </h3>
              <p className="text-gray-600">
                Round-the-clock assistance to ensure your journey goes smoothly
                from start to finish
              </p>
            </div>
          </div>
        </div>
      </section>

      <OfferModal
        offer={selectedOffer}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      <FAQChatbot />
    </div>
  );
}