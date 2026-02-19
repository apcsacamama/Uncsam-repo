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
  Calendar as CalendarIcon, 
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
  
  // Waiver State
  const [showWaiver, setShowWaiver] = useState(false);
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  // Currency State
  const [currency, setCurrency] = useState<'JPY' | 'USD' | 'PHP'>('JPY');
  const [rates, setRates] = useState<{ usd: number; php: number } | null>(null);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    cardName: "", cardNumber: "", expiry: "", cvc: ""
  });

  const [displayData, setDisplayData] = useState({
    title: "Tour Package",
    date: "",
    travelersLabel: "1", 
    price: 0,
    location: "",
    details: [] as any[], 
    isCustom: false
  });

  // --- 3. FETCH DESTINATIONS ---
  useEffect(() => {
    const fetchDestinations = async () => {
        const { data } = await supabase.from('tour_destinations').select('*');
        if (data && data.length > 0) {
            setAllDestinations(prev => {
              const newDests = data.filter(d => !prev.some(p => p.id === d.id));
              return [...prev, ...newDests];
            });
        }
    };
    fetchDestinations();
  }, []);

  // --- FETCH EXCHANGE RATES FROM TOUR PACKAGES ---
  useEffect(() => {
    const fetchExchangeRates = async () => {
      const packageId = searchParams.get("packageId");

      let query = supabase
        .from('tour_packages')
        .select('price, price_usd, price_php')
        .not('price_usd', 'is', null)
        .not('price_php', 'is', null)
        .gt('price', 0)
        .limit(1);

      if (packageId) {
        query = supabase
          .from('tour_packages')
          .select('price, price_usd, price_php')
          .eq('id', packageId)
          .not('price_usd', 'is', null)
          .not('price_php', 'is', null)
          .limit(1);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        console.error("💱 [Currency] Failed to fetch exchange rates:", error?.message);
        return;
      }

      const row = data[0];
      const jpyBase = Number(row.price);
      const usdBase = Number(row.price_usd);
      const phpBase = Number(row.price_php);

      if (jpyBase > 0 && usdBase > 0 && phpBase > 0) {
        const usdRate = usdBase / jpyBase;
        const phpRate = phpBase / jpyBase;
        console.log("💱 [Currency] Rates derived — USD/JPY:", usdRate.toFixed(6), "PHP/JPY:", phpRate.toFixed(6));
        setRates({ usd: usdRate, php: phpRate });
      }
    };
    fetchExchangeRates();
  }, [searchParams]);

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
              .sort((a: Date, b: Date) => a.getTime() - b.getTime());
            
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
  const tripCount = displayData.isCustom && displayData.details.length > 0 ? displayData.details.length : 1;
  const totalDownPayment = tripCount * DOWN_PAYMENT_AMOUNT_JPY;
  const totalAmount = displayData.price;
  const amountToPay = paymentOption === 'full' ? totalAmount : totalDownPayment;
  const balanceAmount = paymentOption === 'full' ? 0 : totalAmount - totalDownPayment;

  // --- CURRENCY CONVERSION ---
  const convertAmount = (amountJPY: number): string => {
    if (currency === 'USD' && rates?.usd) {
      return `$${(amountJPY * rates.usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currency === 'PHP' && rates?.php) {
      return `₱${(amountJPY * rates.php).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `¥${amountJPY.toLocaleString()}`;
  };

  // --- SUBMISSION LOGIC ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWaiverAgreed(false);
    setShowWaiver(true); 
  };

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
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
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
            
            {/* 1. CONTACT INFORMATION */}
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

            {/* 2. PAYMENT OPTIONS */}
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
                                <div className="flex items-baseline gap-2">
                                    <div className="text-lg font-bold text-blue-700">¥{totalDownPayment.toLocaleString()}</div>
                                    {tripCount > 1 && (
                                        <div className="text-xs text-gray-400 font-medium">
                                            (¥{DOWN_PAYMENT_AMOUNT_JPY.toLocaleString()} × {tripCount} trips)
                                        </div>
                                    )}
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* 3. PAYMENT METHOD CARD */}
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
                            <span className="mb-3 text-xl font-bold italic">PP</span> PayPal
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
                            <Input 
                                name="cardNumber" 
                                placeholder="0000 0000 0000 0000" 
                                value={formData.cardNumber} 
                                onChange={handleInputChange} 
                                maxLength={19} 
                                inputMode="numeric"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Expiry Date</Label>
                                <Input 
                                    name="expiry" 
                                    placeholder="MM/YY" 
                                    value={formData.expiry} 
                                    onChange={handleInputChange}
                                    maxLength={5}
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input 
                                    name="cvc" 
                                    placeholder="123" 
                                    maxLength={4} 
                                    value={formData.cvc} 
                                    onChange={handleInputChange} 
                                    inputMode="numeric"
                                />
                            </div>
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50 px-6 py-4 rounded-b-xl flex items-center justify-center text-sm text-gray-500 gap-2">
                <Lock className="w-4 h-4" /> SSL Encrypted Secure Payment
              </CardFooter>
            </Card>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-lg border-t-4 border-t-red-600 flex flex-col overflow-hidden">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center text-lg">
                        Order Summary
                        {displayData.isCustom && <Layers className="w-4 h-4 text-gray-400" />}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] pb-4">
                    <div className="space-y-2 pb-4 border-b text-sm">
                        <div className="flex items-start justify-between">
                            <span className="text-gray-600 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </span>
                            <span className="font-bold text-right capitalize truncate max-w-[150px]">
                                {displayData.location}
                            </span>
                        </div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-600 flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" /> Date
                            </span>
                            <span className="font-bold text-right text-xs max-w-[150px] leading-tight">
                                {displayData.date}
                            </span>
                        </div>
                        <div className="flex items-start justify-between">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Travelers
                            </span>
                            <span className="font-bold text-right">{displayData.travelersLabel}</span>
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
                                    const hasTransfer = day.transportation && day.transportation.includes("airport-transfer");
                                    const AIRPORT_TRANSFER_PRICE = 8000;
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
                                                <div className="font-bold text-red-600 text-sm">¥{listingPrice.toLocaleString()}</div>
                                            </div>
                                            
                                            <div className="text-xs text-gray-600 border-t border-gray-200 pt-2 mt-2">
                                                <p className="font-semibold mb-1">Destinations:</p>
                                                <ul className="list-disc pl-4 space-y-0.5">
                                                    {day.destinations.map((destId: string) => (
                                                        <li key={destId}>{getDestName(destId)}</li>
                                                    ))}
                                                    {hasTransfer && (
                                                        <li className="text-blue-600 font-medium flex items-center -ml-1 mt-1">
                                                            <Plane className="w-3 h-3 mr-1" /> Airport Transfer (+¥{AIRPORT_TRANSFER_PRICE.toLocaleString()})
                                                        </li>
                                                    )}
                                                </ul>
                                                <div className="flex justify-between items-end border-t border-dashed pt-2 mt-2">
                                                    <span className="text-gray-400">Day Total</span>
                                                    <span className="font-bold text-gray-900">¥{day.price.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TRAVEL INCLUSION NOTICE */}
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 relative z-10">
                        <div className="flex items-center gap-2 text-orange-800 font-semibold text-xs mb-2">
                            <Info className="w-3.5 h-3.5" /> Inclusion Notice
                        </div>
                        <p className="text-[11px] text-gray-700 leading-tight mb-2">
                            Package covers <strong>private transportation and guide only</strong>.
                        </p>
                        <div className="space-y-1">
                            <div className="flex items-center text-[10px] text-red-600 gap-1.5 font-medium">
                                <XCircle className="w-3 h-3" /> No Roundtrip Airfare
                            </div>
                            <div className="flex items-center text-[10px] text-red-600 gap-1.5 font-medium">
                                <XCircle className="w-3 h-3" /> No Hotel Accommodations
                            </div>
                        </div>
                    </div>

                    {/* --- TOTALS SECTION --- */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
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
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowCurrencyDropdown(prev => !prev)}
                                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer underline underline-offset-4 decoration-dashed decoration-gray-300"
                                title="Click to change currency"
                              >
                                {convertAmount(amountToPay)}
                              </button>
                              {showCurrencyDropdown && (
                                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                                  <p className="text-[10px] uppercase font-bold text-gray-400 px-3 pt-3 pb-1 tracking-widest">Select Currency</p>
                                  {(['JPY', 'USD', 'PHP'] as const).map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => { setCurrency(c); setShowCurrencyDropdown(false); }}
                                      className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 flex justify-between items-center ${currency === c ? 'text-blue-600 bg-blue-50' : 'text-gray-700'}`}
                                    >
                                      <span>{c === 'JPY' ? '🇯🇵 JPY' : c === 'USD' ? '🇺🇸 USD' : '🇵🇭 PHP'}</span>
                                      {currency === c && <span className="text-[10px] font-bold text-blue-400">✓</span>}
                                    </button>
                                  ))}
                                  {currency !== 'JPY' && (
                                    <p className="text-[10px] text-gray-400 italic px-3 py-2 border-t">
                                      Base: ¥{amountToPay.toLocaleString()} · Updated daily
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
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
                    <p className="text-xs text-center text-gray-500 mt-2 pb-2">
                        By clicking pay, you agree to our Terms & Conditions.
                    </p>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>

{/* --- WAIVER MODAL --- */}
      <Dialog open={showWaiver} onOpenChange={setShowWaiver}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center border-b pb-4">
              ACCIDENT WAIVER AND RELEASE OF LIABILITY FORM
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed py-4">
            <p className="font-semibold italic">Please read carefully before proceeding:</p>

            <p>
              I hereby assume all risks of participating in any and all activities associated with this tour event. 
              I certify that I am physically fit and have sufficiently prepared for participation in this activity.
            </p>

            <div className="bg-red-50 p-4 rounded-md border border-red-100">
              <p className="text-red-900 font-medium">
                <strong>Liability Limitation:</strong> I acknowledge and agree that the liability of 
                <span className="font-bold"> Uncle Sam (UncleSam Japan Tour)</span> is strictly limited to 
                occurrences and activities within the scheduled tours. Uncle Sam shall not be held liable 
                for any incidents, injuries, or losses occurring outside of the official tour itinerary.
              </p>
            </div>

            <p>
              (A) I WAIVE, RELEASE, AND DISCHARGE from any and all liability, including but not 
              limited to, liability arising from the negligence or fault of the entities or persons released, 
              for my death, disability, personal injury, property damage, or actions of any kind.
            </p>

            <p>
              (B) I INDEMNIFY AND HOLD HARMLESS the entities or persons mentioned in this 
              paragraph from any and all liabilities or claims made as a result of participation in this 
              activity, whether caused by negligence or otherwise.
            </p>

            <div className="mt-6 pt-6 border-t space-y-4">
              <label className="flex items-start gap-3 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={waiverAgreed}
                  onChange={(e) => setWaiverAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-600 cursor-pointer flex-shrink-0"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I, <span className="font-bold text-gray-900">{formData.firstName} {formData.lastName}</span>, have fully read and understood the waiver above. I agree that checking this box constitutes my electronic acknowledgement and legal agreement to all terms stated in this document.
                </span>
              </label>

              <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase px-1">
                <p>Name: {formData.firstName} {formData.lastName}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowWaiver(false)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white px-8 disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={handleFinalConfirmAndPay}
              disabled={!waiverAgreed}
            >
              I Agree & Authorize Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}