import Navigation from "../components/Navigation";
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
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  const features = [
    {
      icon: <Clock className="w-8 h-8 text-red-600" />,
      title: "12-Hour Private Tours",
      description:
        "Full-day comprehensive tours designed to maximize your experience",
    },
    {
      icon: <Users className="w-8 h-8 text-red-600" />,
      title: "Dedicated Tour Assistant",
      description:
        "Personal guide ensuring your comfort and memorable experience",
    },
    {
      icon: <Car className="w-8 h-8 text-red-600" />,
      title: "Private Van Transportation",
      description: "Comfortable, air-conditioned vehicles for your group",
    },
    {
      icon: <Languages className="w-8 h-8 text-red-600" />,
      title: "Multilingual Service",
      description: "Drivers fluent in English, Japanese, and Tagalog",
    },
    {
      icon: <MapPin className="w-8 h-8 text-red-600" />,
      title: "Hotel Pick-up & Drop-off",
      description: "Convenient door-to-door service for maximum comfort",
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "All-Inclusive Pricing",
      description: "Gas, toll fees, and transportation costs included",
    },
  ];

  const stats = [
    {
      number: "1988",
      label: "Established Since",
      icon: <Award className="w-5 h-5" />,
    },
    {
      number: "10,000+",
      label: "Happy Customers",
      icon: <Users className="w-5 h-5" />,
    },
    {
      number: "50+",
      label: "Destinations",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      number: "4.9",
      label: "Average Rating",
      icon: <Star className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1920&h=600&fit=crop)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
          <div className="flex justify-center mb-6">
            <img
              src="/api/placeholder/120/120"
              alt="UncleSam Tours Logo"
              className="w-24 h-24 rounded-full bg-white p-2"
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About UncleSam Tours
          </h1>
          <p className="text-xl md:text-2xl font-light max-w-3xl mx-auto">
            Your trusted partner in creating unforgettable travel experiences
            since 2022
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Main Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <div>
              <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1 mb-4">
                Our Story
              </Badge>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Creating Personalized Adventures
              </h2>
            </div>

            <div className="prose prose-lg text-gray-700">
              <p className="text-lg leading-relaxed">
                At UncleSam Tours, we specialize in creating personalized,
                private tours designed to give you an unforgettable travel
                experience. Our all-inclusive packages feature 12-hour private
                tours with a dedicated tour assistant, comfortable van
                transportation, and a multilingual driver fluent in English,
                Japanese, and Tagalog.
              </p>

              <p className="text-lg leading-relaxed">
                We take care of everything, including gas, toll fees, hotel
                pick-up and drop-off, so you can relax and enjoy your journey.
                Let UncleSam Tours be your trusted partner in exploring amazing
                destinations with ease and comfort.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/offers">
                <Button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3">
                  Explore Our Tours
                </Button>
              </Link>
              <Link to="/contact">
                <Button
                  variant="outline"
                  className="border-red-600 text-red-600 hover:bg-red-50 px-6 py-3"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop"
              alt="UncleSam Tours Experience"
              className="rounded-lg shadow-xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center space-x-3">
                <Heart className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-bold text-2xl text-gray-900">2+</p>
                  <p className="text-gray-600 text-sm">Years of Excellence</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <div className="text-red-600">{stat.icon}</div>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {stat.number}
              </h3>
              <p className="text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-red-100 text-red-800 text-sm px-3 py-1 mb-4">
              What Makes Us Special
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose UncleSam Tours
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We go above and beyond to ensure your travel experience is
              seamless, comfortable, and unforgettable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-gray-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">{feature.icon}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Inclusions Section */}
        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 mb-16">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
              Everything Included in Every Tour
            </CardTitle>
            <p className="text-gray-700 text-lg">
              No hidden fees, no surprises - just exceptional value and service
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    12-hour private tour duration
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Dedicated tour assistant
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Private van transportation
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Gas and toll fees included
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Hotel pick-up and drop-off service
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-gray-700">
                    Multilingual driver (English, Japanese, Tagalog)
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-xl shadow-lg p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have experienced Japan
            with UncleSam Tours. Book your personalized tour today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/offers">
              <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg">
                View Our Tours
              </Button>
            </Link>
            <Link to="/custom">
              <Button
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 px-8 py-3 text-lg"
              >
                Create Custom Tour
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
