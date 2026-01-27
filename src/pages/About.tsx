import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; 
import { formatDistanceToNow } from "date-fns"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Car,
  Clock,
  Shield,
  Languages,
  MapPin,
  Star,
  CheckCircle,
  Heart,
  Award,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  // --- DATABASE LOGIC FOR REVIEWS ---
  
  const [reviews, setReviews] = useState<any[]>([
    {
      id: "static-1",
      name: "Amy Vanderwall",
      comment: "Great service and tour guide!",
      rating: 4,
      created_at: "2026-01-26",
    },
    {
      id: "static-2",
      name: "Mack Smith",
      comment: "Japan was a dream! Thanks to UncleSam Tours!",
      rating: 5,
      created_at: "2026-01-26",
    }
  ]);

  const [newReview, setNewReview] = useState({ name: "", comment: "", rating: 5 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Just now";
    if (dateString === "2026-01-26") return "1/26/2026";

    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "Just now";
    }
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 5) return "Excellent";
    if (rating === 4) return "Very Good";
    if (rating === 3) return "Great";
    if (rating === 2) return "Fair";
    return "Poor";
  };

  // UPDATED: Fixed Refresh and Double-Entry Logic
  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from('reviews') 
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error.message);
        return;
      }

      if (data) {
        setReviews(prev => {
          // Identify static reviews to keep them at the top
          const staticIds = ["static-1", "static-2"];
          const staticReviews = prev.filter(r => staticIds.includes(r.id));
          
          // Filter data to ensure we don't add something that's already there
          const uniqueNewData = data.filter(dbReview => 
            !staticReviews.some(s => s.id === dbReview.id) &&
            !prev.some(p => p.id === dbReview.id)
          );

          return [...staticReviews, ...uniqueNewData];
        }); 
      }
    };
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name || !newReview.comment || isSubmitting) return;

    setIsSubmitting(true);
    const today = new Date();
    const dateString = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    try {
      const { data, error } = await supabase
        .from('reviews') 
        .insert([
          { 
            name: newReview.name, 
            comment: newReview.comment, 
            rating: newReview.rating,
            date: dateString 
          }
        ])
        .select();

      if (error) {
        alert("Error: " + error.message);
      } else if (data) {
        setReviews(prev => [data[0], ...prev]);
        setNewReview({ name: "", comment: "", rating: 5 });
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- DATA ARRAYS ---
  const stats = [
    { number: "2022", label: "Established Since", icon: <Award className="w-5 h-5" /> },
    { number: "5,000+", label: "Happy Customers", icon: <Users className="w-5 h-5" /> },
    { number: "25+", label: "Destinations", icon: <MapPin className="w-5 h-5" /> },
    { number: "4.9", label: "Average Rating", icon: <Star className="w-5 h-5" /> },
  ];

  const features = [
    { icon: <Clock className="w-8 h-8 text-red-600" />, title: "12-Hour Private Tours", description: "Full-day comprehensive tours designed to maximize your experience" },
    { icon: <Users className="w-8 h-8 text-red-600" />, title: "Dedicated Tour Assistant", description: "Personal guide ensuring your comfort and memorable experience" },
    { icon: <Car className="w-8 h-8 text-red-600" />, title: "Private Van Transportation", description: "Comfortable, air-conditioned vehicles for your group" },
    { icon: <Languages className="w-8 h-8 text-red-600" />, title: "Multilingual Service", description: "Drivers fluent in English, Japanese, and Tagalog" },
    { icon: <MapPin className="w-8 h-8 text-red-600" />, title: "Hotel Pick-up & Drop-off", description: "Convenient door-to-door service for maximum comfort" },
    { icon: <Shield className="w-8 h-8 text-red-600" />, title: "All-Inclusive Pricing", description: "Gas, toll fees, and transportation costs included" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1920&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">About UncleSam Tours</h1>
          <p className="text-xl md:text-2xl font-light max-w-3xl mx-auto">
            Your trusted partner in creating unforgettable travel experiences since 2022
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* --- MAIN STORY SECTION --- */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <Badge className="bg-red-50 text-red-500 border-none px-3 py-1">Our Story</Badge>
            <h2 className="text-4xl font-bold text-gray-900">Creating Personalized Adventures</h2>
            <div className="text-gray-600 text-lg space-y-4">
              <p>At UncleSam Tours, we specialize in creating personalized, private tours designed to give you an unforgettable travel experience. Our all-inclusive packages feature 12-hour private tours with a dedicated tour assistant, comfortable van transportation, and a multilingual driver fluent in English, Japanese, and Tagalog.</p>
              <p>We take care of everything, including gas, toll fees, hotel pick-up and drop-off, so you can relax and enjoy your journey. Let UncleSam Tours be your trusted partner in exploring amazing destinations with ease and comfort.</p>
            </div>
            <div className="flex gap-4 pt-2">
              <Link to="/offers"><Button className="bg-red-600 hover:bg-red-700 text-white px-6">Explore Our Tours</Button></Link>
              <Link to="/contact"><Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 px-6">Contact Us</Button></Link>
            </div>
          </div>
          
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop" className="rounded-lg shadow-2xl w-full object-cover" alt="Mountain view" />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
              <div className="bg-red-50 p-2 rounded-lg"><Heart className="w-6 h-6 text-red-500" /></div>
              <div><p className="text-2xl font-bold text-gray-900">2+</p><p className="text-gray-500 text-xs">Years of Excellence</p></div>
            </div>
          </div>
        </div>

        {/* --- STATISTICS SECTION --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-red-50 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <div className="text-red-500">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</h3>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* --- WHY CHOOSE SECTION --- */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <Badge className="bg-red-50 text-red-500 border-none mb-4">What Makes Us Special</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose UncleSam Tours</h2>
            <p className="text-gray-500 text-lg max-w-3xl mx-auto">We go above and beyond to ensure your travel experience is seamless, comfortable, and unforgettable</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="shrink-0">{feature.icon}</div>
                    <div><h3 className="text-lg font-bold text-gray-900 mb-1">{feature.title}</h3><p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* --- INCLUSIONS SECTION --- */}
        <div className="bg-[#FFF1F2] rounded-lg border border-red-100 p-10 mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#0F172A] mb-4">Everything Included in Every Tour</h2>
            <p className="text-gray-600 text-lg">No hidden fees, no surprises - just exceptional value and service</p>
          </div>
          <div className="grid md:grid-cols-2 gap-y-4 gap-x-12 max-w-5xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">12-hour private tour duration</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">Dedicated tour assistant</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">Private van transportation</span></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">Gas and toll fees included</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">Hotel pick-up and drop-off service</span></div>
              <div className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-gray-700 text-lg">Multilingual driver (English, Japanese, Tagalog)</span></div>
            </div>
          </div>
        </div>

        {/* --- CUSTOMER REVIEWS SECTION --- */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-red-50 text-red-400 mb-2">Testimonials</Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Customer Reviews</h2>
            <p className="text-gray-600 text-lg">See what our customers have to say about their UncleSam experience</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review, index) => (
                  <Card key={review.id || index} className="border-none shadow-sm bg-white">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-gray-900">{review.name}</h4>
                          <p className="text-gray-400 text-sm">{formatDate(review.created_at)}</p>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 italic">"{review.comment}"</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 py-10">No reviews yet. Be the first to leave one!</p>
              )}
            </div>
            <div className="lg:col-span-1">
              <Card className="border border-red-100 shadow-sm">
                <CardHeader><CardTitle className="text-xl font-bold">Leave a Review</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="focus:outline-none transition-transform active:scale-90"
                        >
                          <Star className={`w-6 h-6 ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm font-bold text-red-600">
                      {getRatingLabel(newReview.rating)}
                    </p>
                  </div>

                  <input className="w-full p-3 border border-gray-100 rounded-md bg-gray-50 text-black" placeholder="Your Name" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} />
                  <textarea className="w-full p-3 border border-gray-100 rounded-md bg-gray-50 text-black" rows={4} placeholder="Share your experience..." value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} />
                  
                  <Button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full bg-red-600 text-white flex gap-2 justify-center items-center">
                    <Send className="w-4 h-4" /> {isSubmitting ? "Posting..." : "Post Review"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* --- CTA SECTION --- */}
        <div className="text-center bg-white rounded-xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Ready to Start Your Adventure?</h2>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto text-lg">Join thousands of satisfied customers who have experienced Japan with UncleSam Tours. Book your personalized tour today!</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/offers"><Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg">View Our Tours</Button></Link>
            <Link to="/custom"><Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-3 text-lg">Create Custom Tour</Button></Link>
          </div>
        </div>

      </div>
    </div>
  );
}