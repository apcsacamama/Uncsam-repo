import Navigation from "../components/Navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  Calendar,
  Users,
  Star,
  CheckCircle,
  Globe,
} from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    tourType: "general",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setSubmitted(true);
    setIsSubmitting(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6 text-red-600" />,
      title: "Email Us",
      primary: "unclesamtourservices1988@gmail.com",
      secondary: "For reservations and inquiries",
      action: "mailto:unclesamtourservices1988@gmail.com",
    },
    {
      icon: <Phone className="w-6 h-6 text-red-600" />,
      title: "Call Us",
      primary: "+81 80-5331-1738",
      secondary: "Available 24/7 for your convenience",
      action: "tel:+81805331738",
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-red-600" />,
      title: "WhatsApp",
      primary: "+81 80-5331-1738",
      secondary: "Quick responses via WhatsApp",
      action: "https://wa.me/81805331738",
    },
  ];

  const businessHours = [
    { day: "Monday - Friday", hours: "9:00 AM - 8:00 PM JST" },
    { day: "Saturday - Sunday", hours: "10:00 AM - 6:00 PM JST" },
    { day: "Holidays", hours: "By appointment" },
  ];

  const faqs = [
    {
      question: "How far in advance should I book?",
      answer:
        "We recommend booking at least 3-7 days in advance to ensure availability.",
    },
    {
      question: "Do you provide tours in other languages?",
      answer: "Yes! Our drivers are fluent in English, Japanese, and Tagalog.",
    },
    {
      question: "What's included in the tour price?",
      answer:
        "All tours include 12-hour private tour, van transportation, gas, tolls, and hotel pick-up/drop-off.",
    },
    {
      question: "Can you customize tours for special occasions?",
      answer:
        "Absolutely! We specialize in creating personalized tours for birthdays, anniversaries, and special celebrations.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div className="bg-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-xl text-red-100 max-w-3xl mx-auto">
            Ready to start your adventure? Contact our friendly team for
            reservations and inquiries. We're here to help you create
            unforgettable memories!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Contact Methods */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1 mb-4">
              📌 FOR RESERVATION/INQUIRIES
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-gray-600 text-lg">
              Choose your preferred method of communication - we're always ready
              to help
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {contactMethods.map((method, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-gray-200"
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {method.title}
                  </h3>
                  <p className="text-lg font-medium text-red-600 mb-1">
                    {method.primary}
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    {method.secondary}
                  </p>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => window.open(method.action, "_blank")}
                  >
                    Contact Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Contact Info */}
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Quick Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">
                        unclesamtourservices1988@gmail.com
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">+81 80-5331-1738</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700">
                        Serving Japan & International Visitors
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">
                    Business Hours
                  </h4>
                  <div className="space-y-2">
                    {businessHours.map((hours, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-700">{hours.day}</span>
                        <span className="text-gray-900 font-medium">
                          {hours.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">
                Send us a Message
              </CardTitle>
              <p className="text-gray-600">
                Fill out the form below and we'll get back to you within 24
                hours
              </p>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for contacting UncleSam Tours. We'll respond to
                    your inquiry within 24 hours.
                  </p>
                  <Button
                    onClick={() => setSubmitted(false)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+81 XXX-XXXX-XXXX"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tourType">Tour Interest</Label>
                    <select
                      id="tourType"
                      name="tourType"
                      value={formData.tourType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="nagoya">Nagoya Tour Package</option>
                      <option value="tokyo">Tokyo Disney Tour</option>
                      <option value="custom">Custom Tour</option>
                      <option value="group">Group Booking</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Tell us about your travel plans, preferred dates, number of travelers, or any special requirements..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">
                  Frequently Asked Questions
                </CardTitle>
                <p className="text-gray-600">
                  Quick answers to common questions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h4>
                      <p className="text-gray-600 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Calendar className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Emergency Contact
                    </h3>
                    <p className="text-blue-800 text-sm mb-3">
                      If you're already on a tour and need immediate assistance,
                      please call our emergency line.
                    </p>
                    <p className="font-medium text-blue-900">
                      +81 80-5331-1738
                    </p>
                    <p className="text-blue-700 text-xs">
                      Available 24/7 for current tour guests
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="font-semibold text-green-900 mb-2">
                  Join Our Happy Customers
                </h3>
                <p className="text-green-800 text-sm mb-4">
                  Over 10,000 satisfied travelers have experienced Japan with us
                  since 1988
                </p>
                <div className="flex justify-center items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-yellow-500 fill-current"
                    />
                  ))}
                  <span className="ml-2 text-green-900 font-medium">
                    4.9/5 Rating
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
