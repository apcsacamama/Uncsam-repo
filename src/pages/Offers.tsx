import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Search, SlidersHorizontal, Loader2, X, WifiOff } from "lucide-react";
import OfferCard from "../components/OfferCard";
import OfferModal from "../components/OfferModal";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { TourPackage } from "../types/travel";
import { Badge } from "../components/ui/badge";

// --- ADDED: Import the hook ---
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";

export default function Offers() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<TourPackage | null>(null);
  
  // Data State
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<"all" | "under-50k" | "50k-100k" | "over-100k">("all");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setIsLoading(true);
    setError(null);

    // 1. TIMEOUT GUARD: Force fail if Supabase takes longer than 5 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    // 2. The Real Request
    const dataPromise = supabase.from('tour_packages').select('*');

    try {
      console.log("🟡 Attempting to fetch from Supabase...");
      
      // Race: Whichever finishes first wins
      const result: any = await Promise.race([dataPromise, timeoutPromise]);
      
      const { data, error } = result;

      if (error) throw error;

      console.log("🟢 Data received!", data?.length, "items");

      // 3. IMAGE FIX: Filter out bad Facebook links
      const formattedPackages: TourPackage[] = (data || []).map((pkg: any) => {
        const imgStr = pkg.image || "";
        // Check for expired meta/facebook links
        const isExpiredLink = imgStr.includes("scontent") || imgStr.includes("fbcdn");

        return {
          id: pkg.id,
          title: pkg.title,
          // Use Unsplash fallback if link is dead or missing
          image: (!pkg.image || isExpiredLink) 
            ? "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=60"
            : pkg.image,
          price: pkg.price,
          description: pkg.description,
          destinations: pkg.destinations || [],
          inclusions: ["Private Van Transfer", "Hotel Pick-up & Drop-off", "Gas & Tolls", "Professional Driver"],
          duration: "12 Hours",
          featured: false
        };
      });

      setPackages(formattedPackages);

    } catch (err: any) {
      console.error("🔴 Fetch Error:", err);
      if (err.message === "Timeout") {
        setError("Network timed out. Codespaces might be blocking the connection.");
      } else {
        setError("Could not load offers. " + (err.message || "Unknown error"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- ADDED: Use the hook here ---
  useRefreshOnFocus(fetchPackages);

  // --- Filter Logic ---
  const filteredPackages = useMemo(() => {
    let result = [...packages];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        (pkg) =>
          pkg.title.toLowerCase().includes(lowerTerm) ||
          pkg.destinations.some((d) => d.toLowerCase().includes(lowerTerm))
      );
    }

    if (priceRange === "under-50k") result = result.filter((pkg) => pkg.price < 50000);
    else if (priceRange === "50k-100k") result = result.filter((pkg) => pkg.price >= 50000 && pkg.price <= 100000);
    else if (priceRange === "over-100k") result = result.filter((pkg) => pkg.price > 100000);

    if (sortBy === "price-low") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-high") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc") result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [packages, searchTerm, sortBy, priceRange]);

  const handleBookNow = (offer: TourPackage) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSortBy("recommended");
    setPriceRange("all");
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Exclusive Deals and Offers
          </h1>
          <p className="text-gray-600 mb-6">
            Discover amazing travel packages at unbeatable prices
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by destination..."
                className="pl-10 h-12 text-base"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12 bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant={showFilters ? "default" : "outline"}
                className={`h-12 px-6 flex gap-2 ${showFilters ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filters
                {priceRange !== 'all' && (
                  <Badge className="ml-1 bg-white text-blue-600 hover:bg-white h-5 px-1.5">1</Badge>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
             <div className="mt-4 p-4 bg-gray-50 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Filter Options</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid md:grid-cols-3 gap-6">
                   <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Price Range</label>
                      <div className="flex flex-wrap gap-2">
                         <Button variant={priceRange === "all" ? "default" : "outline"} size="sm" onClick={() => setPriceRange("all")} className={priceRange === "all" ? "bg-gray-800" : "bg-white"}>Any Price</Button>
                         <Button variant={priceRange === "under-50k" ? "default" : "outline"} size="sm" onClick={() => setPriceRange("under-50k")} className={priceRange === "under-50k" ? "bg-gray-800" : "bg-white"}>Under ¥50k</Button>
                         <Button variant={priceRange === "50k-100k" ? "default" : "outline"} size="sm" onClick={() => setPriceRange("50k-100k")} className={priceRange === "50k-100k" ? "bg-gray-800" : "bg-white"}>¥50k - ¥100k</Button>
                         <Button variant={priceRange === "over-100k" ? "default" : "outline"} size="sm" onClick={() => setPriceRange("over-100k")} className={priceRange === "over-100k" ? "bg-gray-800" : "bg-white"}>Over ¥100k</Button>
                      </div>
                   </div>
                </div>
             </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-gray-600 font-medium">Found {filteredPackages.length} offers</span>
          {(searchTerm || priceRange !== 'all') && (
            <Button variant="link" onClick={clearFilters} className="text-red-600 h-auto p-0">
              Clear all filters
            </Button>
          )}
        </div>

        {/* --- STATE HANDLING --- */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : error ? (
           // ERROR STATE
           <div className="text-center py-20 bg-red-50 rounded-lg border border-red-200">
               <WifiOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-red-900 mb-2">Connection Issue</h3>
               <p className="text-red-600 mb-6">{error}</p>
               <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={fetchPackages}>
                   Retry Connection
               </Button>
           </div>
        ) : filteredPackages.length > 0 ? (
          // SUCCESS STATE
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onBookNow={() => handleBookNow(offer)}
              />
            ))}
          </div>
        ) : (
          // EMPTY STATE
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your search terms or filters
            </p>
            <Button 
              variant="default" 
              className="bg-red-600 hover:bg-red-700"
              onClick={clearFilters}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </main>

      {selectedOffer && (
        <OfferModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          offer={selectedOffer}
        />
      )}
    </div>
  );
}