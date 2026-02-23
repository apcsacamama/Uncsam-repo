import Navigation from "../components/Navigation";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  Search, SlidersHorizontal, Loader2, X, WifiOff, 
  Edit, Plus, Save, Plane, Trash2, CheckCircle 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import OfferCard from "../components/OfferCard";
import OfferModal from "../components/OfferModal";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { TourPackage } from "../types/travel";
import { Badge } from "../components/ui/badge";
import { cn } from "../lib/utils";

// --- HOOKS ---
import { useRefreshOnFocus } from "../hooks/useRefreshOnFocus";
import { useIsAdmin } from "../hooks/useIsAdmin";

export default function Offers() {
  const { isAdmin } = useIsAdmin();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<TourPackage | null>(null);
  
  // --- NEW STATE FOR NOTICE ---
  const [isNoticeOpen, setIsNoticeOpen] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<TourPackage | null>(null);

  // --- ADMIN STATE ---
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPkgId, setEditingPkgId] = useState<number | string | null>(null);
  const [pkgForm, setPkgForm] = useState({ title: "", price: 0, description: "", image: "" });

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
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );
    const dataPromise = supabase.from('tour_packages').select('*').order('id', { ascending: true });

    try {
      const result: any = await Promise.race([dataPromise, timeoutPromise]);
      const { data, error } = result;
      if (error) throw error;

      const formattedPackages: TourPackage[] = (data || []).map((pkg: any) => {
        const imgStr = pkg.image || "";
        const isExpiredLink = imgStr.includes("scontent") || imgStr.includes("fbcdn");
        return {
          id: pkg.id,
          title: pkg.title,
          image: (!pkg.image || isExpiredLink) 
            ? "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=60"
            : pkg.image,
          price: pkg.price,
          description: pkg.description,
          destinations: pkg.destinations || [],
          inclusions: pkg.inclusions || ["Private Van Transfer", "Hotel Pick-up & Drop-off", "Gas & Tolls", "Professional Driver"],
          duration: "12 Hours",
          featured: false
        };
      });
      setPackages(formattedPackages);
    } catch (err: any) {
      console.error("🔴 Fetch Error:", err);
      setError(err.message === "Timeout" ? "Network timed out." : "Could not load offers.");
    } finally {
      setIsLoading(false);
    }
  };

  useRefreshOnFocus(fetchPackages);

  // --- ADMIN FUNCTIONS ---
  const handleSavePackage = async () => {
    if (!pkgForm.title || !pkgForm.price) {
        alert("Title and Price are required.");
        return;
    }
    setIsSaving(true);
    try {
        if (editingPkgId) {
            const { error } = await supabase.from('tour_packages').update({
                    title: pkgForm.title,
                    price: pkgForm.price,
                    description: pkgForm.description,
                }).eq('id', editingPkgId);
            if (error) throw error;
            alert("Package updated!");
        } else {
            const { error } = await supabase.from('tour_packages').insert([{
                    title: pkgForm.title,
                    price: pkgForm.price,
                    description: pkgForm.description,
                    image: pkgForm.image || null
                }]);
            if (error) throw error;
            alert("New package created!");
        }
        fetchPackages();
        resetAdminForm();
    } catch (error: any) {
        alert(`Failed to save: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeletePackage = async (id: number | string) => {
      if(!confirm("Are you sure you want to delete this package?")) return;
      try {
          const { error } = await supabase.from('tour_packages').delete().eq('id', id);
          if (error) throw error;
          fetchPackages();
      } catch (error) {
          alert("Failed to delete package.");
      }
  };

  const prepareEdit = (pkg: TourPackage) => {
      setEditingPkgId(pkg.id);
      setPkgForm({ title: pkg.title, price: pkg.price, description: pkg.description, image: pkg.image });
  };

  const resetAdminForm = () => {
      setEditingPkgId(null);
      setPkgForm({ title: "", price: 0, description: "", image: "" });
  };

  // --- Filter Logic ---
  const filteredPackages = useMemo(() => {
    let result = [...packages];
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter((pkg) =>
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

  // --- UPDATED BOOKING LOGIC ---
  const handleBookNow = (offer: TourPackage) => {
    setPendingOffer(offer);
    setIsNoticeOpen(true);
  };

  const confirmNoticeAndProceed = () => {
    if (pendingOffer) {
      setSelectedOffer(pendingOffer);
      setIsModalOpen(true);
    }
    setIsNoticeOpen(false);
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
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Exclusive Deals and Offers</h1>
                <p className="text-gray-600">Discover amazing travel packages at unbeatable prices</p>
              </div>
              {isAdmin && (
                  <Button className="bg-red-600 hover:bg-red-700 text-white shadow-md" onClick={() => setIsManageModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" /> Manage Packages
                  </Button>
              )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input placeholder="Search by destination..." className="pl-10 h-12 text-base" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12 bg-white"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={showFilters ? "default" : "outline"} className={`h-12 px-6 flex gap-2 ${showFilters ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-5 w-5" /> Filters
                {priceRange !== 'all' && <Badge className="ml-1 bg-white text-blue-600 hover:bg-white h-5 px-1.5">1</Badge>}
              </Button>
            </div>
          </div>

          {showFilters && (
             <div className="mt-4 p-4 bg-gray-50 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Filter Options</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                   <div>
                      <label className="text-sm font-medium text-gray-600 mb-2 block">Price Range</label>
                      <div className="flex flex-wrap gap-2">
                         {["all", "under-50k", "50k-100k", "over-100k"].map((range: any) => (
                           <Button key={range} variant={priceRange === range ? "default" : "outline"} size="sm" onClick={() => setPriceRange(range)} className={priceRange === range ? "bg-gray-800" : "bg-white"}>
                             {range === "all" ? "Any Price" : range.replace("-", " - ").replace("under", "Under").replace("over", "Over").replace(/k/g, "k")}
                           </Button>
                         ))}
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
            <Button variant="link" onClick={clearFilters} className="text-red-600 h-auto p-0">Clear all filters</Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-red-600" /></div>
        ) : error ? (
           <div className="text-center py-20 bg-red-50 rounded-lg border border-red-200">
               <WifiOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-red-900 mb-2">Connection Issue</h3>
               <p className="text-red-600 mb-6">{error}</p>
               <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={fetchPackages}>Retry Connection</Button>
           </div>
        ) : filteredPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPackages.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onBookNow={() => handleBookNow(offer)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers found</h3>
            <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={clearFilters}>Clear All Filters</Button>
          </div>
        )}
      </main>

      {/* --- TRAVEL INCLUSION NOTICE MODAL --- */}
      {isNoticeOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md shadow-2xl border-orange-200">
            <CardHeader className="bg-orange-50 border-b border-orange-100">
              <div className="flex items-center gap-3 text-orange-700">
                <Plane className="w-6 h-6" />
                <CardTitle className="text-xl">Travel Inclusion Notice</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Please be advised that this tour package covers <strong>private transportation and tour services only</strong>.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Not Included:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center text-red-600 text-sm font-medium"><X className="w-4 h-4 mr-2" /> Roundtrip Airfare</li>
                    <li className="flex items-center text-red-600 text-sm font-medium"><X className="w-4 h-4 mr-2" /> Hotel Accommodations</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 italic">By proceeding, you acknowledge that these external costs are not covered by UncleSam.</p>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsNoticeOpen(false)}>Go Back</Button>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={confirmNoticeAndProceed}>I Understand</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedOffer && (
        <OfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} offer={selectedOffer} />
      )}

      {/* --- ADMIN MODAL: MANAGE PACKAGES --- */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50 py-3">
              <div>
                  <CardTitle>Manage Tour Packages</CardTitle>
                  <p className="text-xs text-gray-500 mt-1">Create or edit your travel offers.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setIsManageModalOpen(false); resetAdminForm(); }}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex flex-1 overflow-hidden p-0">
                <div className="w-1/2 border-r bg-white overflow-y-auto p-4">
                    <div className="flex justify-between items-center mb-3 sticky top-0 bg-white pb-2 border-b">
                        <h3 className="text-sm font-bold text-gray-700">Current Packages</h3>
                    </div>
                    <div className="space-y-2">
                        {packages.map(pkg => (
                            <div key={pkg.id} className={cn("p-3 border rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors group", editingPkgId === pkg.id && "border-blue-500 bg-blue-50 ring-1 ring-blue-200")} onClick={() => prepareEdit(pkg)}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-800">{pkg.title}</p>
                                        <p className="text-green-600 font-semibold text-xs">¥{pkg.price.toLocaleString()}</p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeletePackage(pkg.id); }}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800">{editingPkgId ? "Edit Package" : "Create New Package"}</h3>
                        {editingPkgId && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={resetAdminForm}><Plus className="w-3 h-3 mr-1" /> New</Button>}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Title</label>
                            <Input value={pkgForm.title} onChange={(e) => setPkgForm({...pkgForm, title: e.target.value})} placeholder="e.g. Kyoto 3-Day Special" className="mt-1 bg-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Price (¥)</label>
                            <Input type="number" value={pkgForm.price} onChange={(e) => setPkgForm({...pkgForm, price: Number(e.target.value)})} className="mt-1 bg-white" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase">Description</label>
                            <Textarea className="w-full min-h-[100px] mt-1 p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={pkgForm.description} onChange={(e) => setPkgForm({...pkgForm, description: e.target.value})} placeholder="Details about this tour..." />
                        </div>
                        <Button onClick={handleSavePackage} disabled={isSaving} className="w-full bg-blue-600 hover:bg-blue-700 mt-2">
                            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> {editingPkgId ? "Update Package" : "Create Package"}</>}
                        </Button>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}