import Navigation from "../components/Navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  HelpCircle,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Users,
  CreditCard,
  MapPin,
  Calendar,
} from "lucide-react";
import { useState } from "react";

const faqCategories = [
  {
    id: "booking",
    label: "Booking",
    icon: Calendar,
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "payment",
    label: "Payment",
    icon: CreditCard,
    color: "bg-green-100 text-green-800",
  },
  {
    id: "travel",
    label: "Travel",
    icon: MapPin,
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "support",
    label: "Support",
    icon: Users,
    color: "bg-orange-100 text-orange-800",
  },
];

const faqs = [
  {
    id: 1,
    category: "booking",
    question: "How do I make a booking?",
    answer:
      'You can make a booking by browsing our offers page, selecting a package that interests you, and clicking "Get Tickets". Follow the booking form to complete your reservation. You\'ll receive a confirmation email once your booking is confirmed.',
  },
  {
    id: 2,
    category: "booking",
    question: "Can I modify or cancel my booking?",
    answer:
      "Yes, you can modify or cancel your booking up to 48 hours before your travel date. Please contact our customer support team or use your customer profile to make changes. Cancellation fees may apply depending on how close to the travel date you cancel.",
  },
  {
    id: 3,
    category: "booking",
    question: "What information do I need to provide when booking?",
    answer:
      "You'll need to provide your full name, email address, phone number, travel date, and number of travelers. For international travelers, you may also need to provide passport information.",
  },
  {
    id: 4,
    category: "payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. All payments are processed securely through our encrypted payment system.",
  },
  {
    id: 5,
    category: "payment",
    question: "When is payment processed?",
    answer:
      "Payment is processed immediately upon booking confirmation. You'll receive a receipt via email, and the charge will appear on your statement within 1-2 business days.",
  },
  {
    id: 6,
    category: "payment",
    question: "Do you offer refunds?",
    answer:
      "Refunds are available according to our cancellation policy. Full refunds are available for cancellations made 7+ days before travel. Partial refunds may be available for cancellations made 2-7 days before travel. No refunds for cancellations within 48 hours of travel.",
  },
  {
    id: 7,
    category: "travel",
    question: "What should I bring on the tour?",
    answer:
      "We recommend bringing comfortable walking shoes, weather-appropriate clothing, a camera, and any personal items you may need. Specific recommendations will be provided in your confirmation email based on your chosen package.",
  },
  {
    id: 8,
    category: "travel",
    question: "Are meals included in the tour packages?",
    answer:
      "Meal inclusions vary by package. Many of our tours include lunch or lunch vouchers. Check your specific package details or contact us for more information about what's included in your tour.",
  },
  {
    id: 9,
    category: "travel",
    question: "What happens if weather affects my tour?",
    answer:
      "Tours operate in most weather conditions. In case of severe weather that makes travel unsafe, we'll contact you to reschedule or provide a full refund. We monitor weather conditions closely and prioritize your safety.",
  },
  {
    id: 10,
    category: "support",
    question: "How can I contact customer support?",
    answer:
      "You can reach our customer support team 24/7 by phone at +81-3-1234-5678, email at support@unclesam-travel.com, or through the live chat feature on our website.",
  },
  {
    id: 11,
    category: "support",
    question: "What languages do you support?",
    answer:
      "Our customer support team speaks Japanese and English fluently. We can also arrange assistance in other languages with advance notice.",
  },
  {
    id: 12,
    category: "support",
    question: "Do you provide travel insurance?",
    answer:
      "We strongly recommend travel insurance for all trips. While we don't provide insurance directly, we can recommend trusted travel insurance providers. Please consider purchasing insurance to protect your investment.",
  },
];

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <HelpCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find quick answers to common questions about our travel services and
            booking process
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search frequently asked questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="rounded-full"
            >
              All Categories
            </Button>
            {faqCategories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* FAQ Results */}
        <div className="mb-8">
          <p className="text-gray-600 mb-6">
            {filteredFAQs.length}{" "}
            {filteredFAQs.length === 1 ? "question" : "questions"} found
            {searchTerm && ` for "${searchTerm}"`}
          </p>

          {filteredFAQs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFAQs.map((faq) => {
                const category = faqCategories.find(
                  (cat) => cat.id === faq.category,
                );
                return (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id.toString()}
                    className="bg-white rounded-lg border shadow-sm"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                      <div className="flex items-start space-x-3">
                        {category && (
                          <Badge className={category.color}>
                            <category.icon className="w-3 h-3 mr-1" />
                            {category.label}
                          </Badge>
                        )}
                        <span className="font-medium text-gray-900">
                          {faq.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <p className="text-gray-700 leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No questions found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or browse all categories
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Still Need Help?</CardTitle>
            <p className="text-center text-gray-600">
              Our customer support team is here to help you 24/7
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Phone Support
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Talk to our support team
                </p>
                <p className="font-medium text-blue-600">+81-3-1234-5678</p>
                <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Available 24/7
                </div>
              </div>

              <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Email Support
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Send us a detailed message
                </p>
                <p className="font-medium text-green-600">
                  support@unclesam-travel.com
                </p>
                <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Response within 2 hours
                </div>
              </div>

              <div className="text-center p-6 border rounded-lg hover:bg-gray-50">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Live Chat</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Chat with us in real-time
                </p>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  Start Chat
                </Button>
                <div className="flex items-center justify-center mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3 mr-1" />
                  Available 9 AM - 10 PM JST
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
