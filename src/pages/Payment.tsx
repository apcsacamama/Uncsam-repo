import Navigation from "../components/Navigation";
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
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get data passed from the Custom Tour page
  const location = searchParams.get("location") || "Custom Tour";
  const date = searchParams.get("date") || "2025-01-01";
  const travelers = searchParams.get("travelers") || "1";
  const price = searchParams.get("price") || "0";
  
  // State for form
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate API Payment Processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Navigate to Confirmation with the actual user data
    const params = new URLSearchParams({
      package: "custom",
      custom: "true",
      price: price,
      travelers: travelers,
      location: location,
      date: date,
      // Pass the user details to the confirmation page
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      paymentMethod: paymentMethod
    });

    navigate(`/booking-confirmation?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

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
            
            {/* 1. Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Contact Information
                </CardTitle>
                <CardDescription>We'll use this to send your tickets and updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                            id="firstName" 
                            name="firstName" 
                            placeholder="e.g. Taro" 
                            required 
                            value={formData.firstName}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                            id="lastName" 
                            name="lastName" 
                            placeholder="e.g. Yamada" 
                            required 
                            value={formData.lastName}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                                id="email" 
                                name="email" 
                                type="email" 
                                placeholder="name@example.com" 
                                className="pl-9" 
                                required 
                                value={formData.email}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input 
                                id="phone" 
                                name="phone" 
                                type="tel" 
                                placeholder="+81 90 1234 5678" 
                                className="pl-9" 
                                required 
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Method
                </CardTitle>
                <CardDescription>All transactions are secure and encrypted.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup defaultValue="card" onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                        <Label
                            htmlFor="card"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-600 peer-data-[state=checked]:text-red-600 cursor-pointer"
                        >
                            <CreditCard className="mb-3 h-6 w-6" />
                            Card
                        </Label>
                    </div>
                    <div>
                        <RadioGroupItem value="paypal" id="paypal" className="peer sr-only" />
                        <Label
                            htmlFor="paypal"
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:text-blue-600 cursor-pointer"
                        >
                            <svg className="mb-3 h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.946 5.05-4.336 6.794-9.116 6.794h-.303c-.62 0-1.064.44-1.136 1.06l-.769 4.877a.643.643 0 0 0 .633.744h.001c.62 0 1.064.44 1.136 1.06L9.48 22.38a.641.641 0 0 1-.633.744h-1.68a.643.643 0 0 1-.09-.007z"/></svg>
                            PayPal
                        </Label>
                    </div>
                </RadioGroup>

                {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label>Name on Card</Label>
                            <Input 
                                name="cardName" 
                                placeholder="Name as it appears on card" 
                                value={formData.cardName}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Card Number</Label>
                            <Input 
                                name="cardNumber" 
                                placeholder="0000 0000 0000 0000" 
                                value={formData.cardNumber}
                                onChange={handleInputChange}
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>CVC</Label>
                                <Input 
                                    name="cvc" 
                                    placeholder="123" 
                                    maxLength={3} 
                                    value={formData.cvc}
                                    onChange={handleInputChange}
                                />
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
                    <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2 pb-4 border-b">
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Location
                            </span>
                            <span className="font-medium text-right capitalize">{location}</span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Date
                            </span>
                            <span className="font-medium text-right">{date}</span>
                        </div>
                        <div className="flex items-start justify-between text-sm">
                            <span className="text-gray-600 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Travelers
                            </span>
                            <span className="font-medium text-right">{travelers}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                        <span>Total:</span>
                        <span>¥{parseInt(price).toLocaleString()}</span>
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
