import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "../components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "../components/ui/dialog"; 
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { 
  CreditCard, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  Lock, 
  ArrowRight,
  Loader2,
  Layers,
  Plane,
  Banknote,
  Info,
  XCircle 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient";

const DEFAULT_DESTINATIONS = [
  { id: "hasedera", name: "Hasedera Temple" },
  { id: "kotoku-in", name: "Kotoku-in" },
];

const DOWN_PAYMENT_AMOUNT_JPY = 26000;

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- 1. GET URL PARAMETERS ---
  const isCustom = searchParams.get("custom") === "true";
  const locationParam = searchParams.get("location");
  const dateParam = searchParams.get("date");
  const travelersParam = searchParams.get("travelers");
  const priceParam = searchParams.get("price");
  const cartDataRaw = searchParams.get("cartData");
  const totalPriceParam = searchParams.get("totalPrice");

  // --- 2. STATE ---
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);
  const [dbDate, setDbDate] = useState<string | null>(null);
  const [paymentOption, setPaymentOption] = useState<'full' | 'downpayment'>('full');
  const [showWaiver, setShowWaiver] = useState(false);

  const [displayData, setDisplayData] = useState({
    title: "Tour Package",
    date: "",
    travelersLabel: "1", 
    price: 0,
    location: "",
    details: [] as any[], 
    isCustom: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    cardName: "", cardNumber: "", expiry: "", cvc: ""
  });

  // --- 3. FETCH DESTINATIONS ---
  useEffect(() => {
    const fetchDestinations = async () => {
        const { data } = await supabase.from('tour_destinations').select('*');
        if (data && data.length > 0) {
            setAllDestinations(prev => [...prev, ...data]); 
        }
    };
    fetchDestinations();
  }, []);

  // --- 4. PARSE DATA ---
  useEffect(() => {
    if (isCustom && cartDataRaw) {
      try {
        const cart = JSON.parse(decodeURIComponent(cartDataRaw));
        const total = parseInt(totalPriceParam || "0");
        
        let travelersDisplay = "1";
        if (cart.length > 0) {
            const counts = cart.map((item: any) => item.travelers);
            const min = Math.min(...counts);
            const max = Math.max(...counts);
            travelersDisplay = min === max ? min.toString() : `${min} - ${max}`;
        }
        
        let dateStr = "Multiple Dates";
        let validStartDate = new Date().toISOString(); 

        if (cart.length > 0) {
            const uniqueDates = Array.from(new Set(cart.map((i: any) => format(new Date(i.date), "MMM dd, yyyy"))));
            dateStr = uniqueDates.join(" | ");

            const sortedDates = cart
              .map((item: any) => new Date(item.date))
              .sort((a: any, b: any) => a.getTime() - b.getTime());
            
            if (sortedDates.length > 0) {
                validStartDate = sortedDates[0].toISOString();
            }
        }
        
        setDbDate(validStartDate);

        setDisplayData({
          title: `Custom Itinerary (${cart.length} Days)`,
          date: dateStr,
          travelersLabel: travelersDisplay,
          price: total,
          location: "Japan (Multi-City)",
          details: cart,
          isCustom: true
        });
      } catch (err) {
        console.error("Error parsing cart data", err);
      }
    } else {
      setDbDate(dateParam);
      setDisplayData({
        title: "Standard Tour",
        date: dateParam || "Date not selected",
        travelersLabel: travelersParam || "1",
        price: parseInt(priceParam || "0"),
        location: locationParam || "Japan",
        details: [],
        isCustom: false
      });
    }
  }, [searchParams, isCustom, cartDataRaw, totalPriceParam, dateParam, travelersParam, priceParam, locationParam]);

  // --- INPUT HANDLER ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
        const raw = value.replace(/\D/g, "");
        const truncated = raw.slice(0, 16);
        formattedValue = truncated.replace(/(\d{4})(?=\d)/g, "$1 ");
    } else if (name === "expiry") {
        const raw = value.replace(/\D/g, "");
        const truncated = raw.slice(0, 4);
        formattedValue = truncated.length >= 3 ? `${truncated.slice(0, 2)}/${truncated.slice(2)}` : truncated;
    } else if (name === "cvc") {
        formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // --- TOTALS ---
  const tripCount = displayData.isCustom && displayData.details.length > 0 ? displayData.details.length : 1;
  const totalDownPayment = tripCount * DOWN_PAYMENT_AMOUNT_JPY;
  const totalAmount = displayData.price;
  const amountToPay = paymentOption === 'full' ? totalAmount : totalDownPayment;
  const balanceAmount = paymentOption === 'full' ? 0 : totalAmount - totalDownPayment;

  // --- 5. TRIGGER WAIVER ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowWaiver(true); // Open the modal
  };

  // --- 6. FINAL SUBMIT TO SUPABASE ---
  const handleFinalConfirmAndPay = async () => {
    setShowWaiver(false);
    setIsProcessing(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert("Session expired. Please sign in again.");
        navigate("/signin");
        return;
      }

      const bookingPayload = {
          user_id: user.id,
          itinerary_id: isCustom ? null : (searchParams.get("packageId") || null), 
          pax_count: parseInt(displayData.travelersLabel) || 1,
          total_price: displayData.price, 
          status: "Paid", 
          travel_date: dbDate,
          created_by: formData.email,
          updated_by: formData.email
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingPayload])
        .select();

      if (error) throw error;

      const queryParams = new URLSearchParams({
        bookingId: data[0].booking_id,
        price: displayData.price.toString(),
        date: displayData.date, 
        travelers: displayData.travelersLabel,
        location: displayData.location,
        custom: isCustom ? "true" : "false",
        cartData: cartDataRaw || "",
        paymentType: paymentOption,
        amountPaid: amountToPay.toString(),
        balance: balanceAmount.toString(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        paymentMethod: paymentMethod
      });

      navigate(`/booking-confirmation?${queryParams.toString()}`);

    } catch (err: any) {
      console.error("Booking Error:", err.message);
      alert("Could not save booking: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDestName = (id: string) => {
      const found = allDestinations.find(d => d.id === id);
      return found ? found.name : id; 
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8 text-sm text-gray-500">
            <span>Select Tour</span>
            <span>→</span>
            <span className="font-semibold text-red-600">Details & Payment</span>
            <span>→</span>
            <span>Confirmation</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Secure Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> Contact Information
                </CardTitle>
                <CardDescription>We'll use this to send your tickets and updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" name="firstName" placeholder="e.g. Taro" required value={formData.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" name="lastName" placeholder="e.g. Yamada" required value={formData.lastName} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input id="email" name="email" type="email" placeholder="name@example.com" className="pl-9" required value={formData.email} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input id="phone" name="phone" type="tel" placeholder="+81 90 1234 5678" className="pl-9" required value={formData.phone} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Banknote className="w-5 h-5 text-blue-600" /> Payment Options
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup defaultValue="full" onValueChange={(v) => setPaymentOption(v as any)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Label htmlFor="opt-full" className="rounded-md border-2 p-4 cursor-pointer hover:bg-gray-50 bg-white">
                            <RadioGroupItem value="full" id="opt-full" className="sr-only" />
                            <div className="font-bold">Full Payment</div>
                            <div className="text-lg font-bold text-blue-700">¥{totalAmount.toLocaleString()}</div>
                        </Label>
                        <Label htmlFor="opt-down" className="rounded-md border-2 p-4 cursor-pointer hover:bg-gray-50 bg-white">
                            <RadioGroupItem value="downpayment" id="opt-down" className="sr-only" />
                            <div className="font-bold">Down Payment</div>
                            <div className="text-lg font-bold text-blue-700">¥{totalDownPayment.toLocaleString()}</div>
                        </Label>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Card Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input name="cardName" placeholder="Name on Card" value={formData.cardName} onChange={handleInputChange} />
                <Input name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} maxLength={19} />
                <div className="grid grid-cols-2 gap-4">
                    <Input name="expiry" placeholder="MM/YY" value={formData.expiry} onChange={handleInputChange} maxLength={5} />
                    <Input name="cvc" placeholder="CVC" value={formData.cvc} onChange={handleInputChange} maxLength={4} />
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 text-xs justify-center gap-2">
                <Lock className="w-4 h-4" /> SSL Encrypted
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-t-4 border-t-red-600">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Order Summary {displayData.isCustom && <Layers className="w-4 h-4" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 pb-4 border-b text-sm">
                        <div className="flex justify-between"><span>Location</span><span className="font-bold">{displayData.location}</span></div>
                        <div className="flex justify-between"><span>Date</span><span className="font-bold">{displayData.date}</span></div>
                        <div className="flex justify-between"><span>Travelers</span><span className="font-bold">{displayData.travelersLabel}</span></div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-orange-800 font-semibold text-xs mb-2">
                            <Info className="w-3.5 h-3.5" /> Inclusion Notice
                        </div>
                        <p className="text-[11px] mb-2">Transportation and guide only.</p>
                        <div className="space-y-1 text-[10px] text-red-600 font-medium">
                            <div className="flex items-center"><XCircle className="w-3 h-3 mr-1" /> No Roundtrip Airfare</div>
                            <div className="flex items-center"><XCircle className="w-3 h-3 mr-1" /> No Hotel Accommodations</div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                        <span>Total Due:</span>
                        <span>¥{amountToPay.toLocaleString()}</span>
                    </div>

                    <Button onClick={handleSubmit} disabled={isProcessing || !formData.firstName || !formData.email} className="w-full bg-red-600 py-6 text-lg">
                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : "Pay & Confirm"}
                    </Button>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showWaiver} onOpenChange={setShowWaiver}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-xl font-bold text-center border-b pb-4">ACCIDENT WAIVER & RELEASE OF LIABILITY</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm py-4">
            <p>I hereby assume all risks of participating in any activities associated with this tour.</p>
            <div className="bg-red-50 p-4 rounded border border-red-100 text-red-900 font-medium">
                Uncle Sam is strictly limited to activities within the official tour itinerary.
            </div>
            <div className="mt-8 pt-8 border-t flex flex-col items-center">
              <div className="w-full max-w-md border-b-2 border-black text-center italic text-xl">
                {formData.firstName} {formData.lastName}
              </div>
              <p className="text-[10px] uppercase text-gray-500 font-bold mt-1">Electronic Signature</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setShowWaiver(false)}>Cancel</Button>
            <Button className="bg-red-600 text-white px-8" onClick={handleFinalConfirmAndPay}>I Agree & Authorize Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
