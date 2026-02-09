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
  Banknote 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient";

// --- CONSTANTS ---
const DOWN_PAYMENT_AMOUNT_JPY = 26000; 
const AIRPORT_TRANSFER_PRICE = 8000; 

// Fallback if Supabase is empty/loading
const DEFAULT_DESTINATIONS = [
  { id: "hasedera", name: "Hasedera Temple" },
  { id: "kotoku-in", name: "Kotoku-in" },
];

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- 1. GET URL PARAMETERS ---
  const isCustom = searchParams.get("custom") === "true";
  
  // Standard Params
  const locationParam = searchParams.get("location");
  const dateParam = searchParams.get("date");
  const travelersParam = searchParams.get("travelers");
  const priceParam = searchParams.get("price");

  // Custom Cart Params
  const cartDataRaw = searchParams.get("cartData");
  const totalPriceParam = searchParams.get("totalPrice");

  // --- 2. STATE ---
  const [allDestinations, setAllDestinations] = useState<any[]>(DEFAULT_DESTINATIONS);
  const [displayData, setDisplayData] = useState({
    title: "Tour Package",
    date: "",
    travelersLabel: "1", 
    price: 0,
    location: "",
    details: [] as any[], 
    isCustom: false
  });

  const [paymentOption, setPaymentOption] = useState<'full' | 'downpayment'>('full');

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
        if (cart.length > 0) {
            const uniqueDates = Array.from(new Set(cart.map((i: any) => format(new Date(i.date), "MMM dd, yyyy"))));
            dateStr = uniqueDates.join(" | ");
        }

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

  // Form State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    cardName: "", cardNumber: "", expiry: "", cvc: ""
  });

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
        if (truncated.length >= 3) {
            formattedValue = `${truncated.slice(0, 2)}/${truncated.slice(2)}`;
        } else {
            formattedValue = truncated;
        }
    } else if (name === "cvc") {
        formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  // --- CALCULATE TOTALS ---
  const totalAmount = displayData.price;
  const amountToPay = paymentOption === 'full' ? totalAmount : DOWN_PAYMENT_AMOUNT_JPY;
  const balanceAmount = paymentOption === 'full' ? 0 : totalAmount - DOWN_PAYMENT_AMOUNT_JPY;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));

    const params = new URLSearchParams({
      package: displayData.isCustom ? "custom-itinerary" : "standard",
      custom: displayData.isCustom ? "true" : "false",
      price: displayData.price.toString(),
      travelers: displayData.travelersLabel,
      location: displayData.location,
      date: displayData.date,
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      paymentMethod: paymentMethod,
      cartData: cartDataRaw || "",
      paymentType: paymentOption,
      amountPaid: amountToPay.toString(),
      balance: balanceAmount.toString()
    });

    navigate(`/booking-confirmation?${params.toString()}`);
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
          
          {/* LEFT COLUMN: FORMS */}
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
                    <CardDescription>Choose how you would like to pay today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup defaultValue="full" onValueChange={(v) => setPaymentOption(v as 'full' | 'downpayment')} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <RadioGroupItem value="full" id="opt-full" className="peer sr-only" />
                            <Label htmlFor="opt-full" className="flex flex-col justify-between h-full rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer">
                                <div className="font-bold text-gray-900 mb-1">Full Payment</div>
                                <div className="text-sm text-gray-500 mb-2">Pay the entire amount now.</div>
                                <div className="text-lg font-bold text-blue-700">¥{totalAmount.toLocaleString()}</div>
                            </Label>
                        </div>
                        <div>
                            <RadioGroupItem value="downpayment" id="opt-down" className="peer sr-only" />
                            <Label htmlFor="opt-down" className="flex flex-col justify-between h-full rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 cursor-pointer">
                                <div className="flex justify-between">
                                    <div className="font-bold text-gray-900 mb-1">Down Payment</div>
                                    <div className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded h-fit">INSTALLMENT</div>
                                </div>
                                <div className="text-sm text-gray-500 mb-2">Reserve now, pay the rest later.</div>
                                <div className="text-lg font-bold text-blue-700">¥{DOWN_PAYMENT_AMOUNT_JPY.toLocaleString()}</div>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" /> Payment Method
                </CardTitle>
                <CardDescription>All transactions are secure and encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                        <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:text-red-600 cursor-pointer">
                            <CreditCard className="mb-3 h-6 w-6" /> Card
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
                        <Label htmlFor="paypal" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:text-blue-600 cursor-pointer">
                            <svg className="mb-3 h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.05-4.336 6.794-9.116 6.794h-.303c-.62 0-1.064.44-1.136 1.06l-.769 4.877a.643.643 0 0 0 .633.744h.001c.62 0 1.064.44 1.136 1.06L9.48 22.38a.641.641 0 0 1-.633.744h-1.68a.643.643 0 0 1-.09-.007z"/></svg> PayPal
                        </Label>
                    </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label>Name on Card</Label>
                            <Input name="cardName" placeholder="Name as it appears on card" value={formData.cardName} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input name="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} maxLength={19} inputMode="numeric"/>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expiry Date</Label>
                                <Input name="expiry" placeholder="MM/YY" value={formData.expiry} onChange={handleInputChange} maxLength={5} inputMode="numeric"/>
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input name="cvc" placeholder="123" maxLength={4} value={formData.cvc} onChange={handleInputChange} inputMode="numeric"/>
                            </div>
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-center text-sm text-gray-500 gap-2">
                <Lock className="w-4 h-4" /> SSL Encrypted Payment
              </CardFooter>
            </Card>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-t-4 border-t-red-600">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        Order Summary
                        {displayData.isCustom && <Layers className="w-4 h-4 text-gray-400" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-2 pb-4 border-b">
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </span>
                            <span className="font-medium text-right capitalize truncate max-w-[150px]">
                                {displayData.location}
                            </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date
                            </span>
                            <span className="font-medium text-right text-xs max-w-[150px] text-right leading-tight">
                                {displayData.date}
                            </span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Travelers
                            </span>
                            <span className="font-medium text-right">{displayData.travelersLabel}</span>
                        </div>
                    </div>

                    {/* === CHOSEN TRIPS / ITINERARY === */}
                    {displayData.isCustom && displayData.details.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                                <Layers className="w-4 h-4 text-red-600"/> Chosen Trips
                            </h3>
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                {displayData.details.map((day, idx) => {
                                    // --- 1. DETECT TRANSFER ---
                                    const hasTransfer = day.transportation && day.transportation.includes("airport-transfer");
                                    
                                    // --- 2. CALCULATE BASE LISTING PRICE ---
                                    const listingPrice = day.price - (hasTransfer ? AIRPORT_TRANSFER_PRICE : 0);

                                    return (
                                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 relative">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-[10px] font-bold text-white bg-gray-800 px-2 py-0.5 rounded-full uppercase">Day {idx + 1}</span>
                                                    <div className="font-bold text-gray-800 mt-1">{day.location.toUpperCase()}</div>
                                                    
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">{format(new Date(day.date), "MMM dd")}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-xs text-gray-500 flex items-center">
                                                            <Users className="w-3 h-3 mr-1" />
                                                            {day.travelers}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* --- 3. SHOW ONLY BASE LISTING PRICE IN RED --- */}
                                                <div className="font-bold text-red-600 text-sm">¥{listingPrice.toLocaleString()}</div>
                                            </div>
                                            
                                            <div className="text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2">
                                                <p className="font-semibold mb-1">Destinations:</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {day.destinations.map((destId: string) => (
                                                        <li key={destId}>{getDestName(destId)}</li>
                                                    ))}
                                                    {/* --- 4. SHOW ADD-ON SEPARATELY --- */}
                                                    {hasTransfer && (
                                                        <li className="text-blue-600 font-medium flex items-center -ml-1">
                                                            <Plane className="w-3 h-3 mr-1" /> Airport Transfer (+¥{AIRPORT_TRANSFER_PRICE.toLocaleString()})
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- TOTALS SECTION (DYNAMIC) --- */}
                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                            <span>Package Total:</span>
                            <span>¥{totalAmount.toLocaleString()}</span>
                        </div>
                        
                        {paymentOption === 'downpayment' && (
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <span>Remaining Balance:</span>
                                <span className="font-bold text-orange-600">¥{balanceAmount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-xl font-bold text-gray-900 pt-2 border-t mt-2">
                            <span>Total Due Now:</span>
                            <span>¥{amountToPay.toLocaleString()}</span>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit} 
                        disabled={isProcessing || !formData.firstName || !formData.email}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg mt-4"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Pay & Confirm
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        By clicking pay, you agree to our Terms & Conditions.
                    </p>
                </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}