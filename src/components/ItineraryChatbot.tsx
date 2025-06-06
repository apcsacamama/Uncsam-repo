import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  MapPin,
  X,
  Bot,
  Calendar,
  Clock,
  Download,
  CloudRain,
  Sun,
  AlertTriangle,
  Navigation,
  Camera,
  Utensils,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface ItineraryItem {
  time: string;
  activity: string;
  location: string;
  duration: string;
  type: "travel" | "sightseeing" | "meal" | "activity";
  notes?: string;
}

interface DayItinerary {
  day: number;
  date: string;
  items: ItineraryItem[];
  weather: {
    condition: string;
    temp: string;
    warning?: string;
  };
}

interface ItineraryChatbotProps {
  selectedDestinations: string[];
  isVisible: boolean;
  onClose: () => void;
  travelDate: string;
  travelers: number;
}

export default function ItineraryChatbot({
  selectedDestinations,
  isVisible,
  onClose,
  travelDate,
  travelers,
}: ItineraryChatbotProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]);
  const [weatherWarnings, setWeatherWarnings] = useState<string[]>([]);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Mock weather data
  const mockWeather = {
    "Nagoya Castle": { condition: "Sunny", temp: "24°C" },
    Legoland: { condition: "Partly Cloudy", temp: "22°C" },
    "Science Museum": { condition: "Clear", temp: "25°C" },
    "Oasis 21": {
      condition: "Rain",
      temp: "18°C",
      warning: "Heavy rain expected",
    },
    "Noritake Garden": { condition: "Sunny", temp: "26°C" },
    "Public Aquarium": { condition: "Overcast", temp: "20°C" },
  };

  const alternativeDestinations = [
    "Atsuta Shrine",
    "Toyota Commemorative Museum",
    "Nagoya TV Tower",
    "Shirotori Garden",
    "Nagoya Port Building",
    "Tokugawa Art Museum",
  ];

  useEffect(() => {
    if (isVisible && selectedDestinations.length > 0) {
      generateItinerary();
    }
  }, [isVisible, selectedDestinations]);

  const generateItinerary = async () => {
    setIsGenerating(true);

    // Check weather warnings
    const warnings: string[] = [];
    selectedDestinations.forEach((dest) => {
      const weather = mockWeather[dest as keyof typeof mockWeather];
      if (weather?.warning) {
        warnings.push(`${dest}: ${weather.warning}`);
      }
    });
    setWeatherWarnings(warnings);

    if (warnings.length > 0) {
      setAlternatives(
        alternativeDestinations
          .filter((alt) => !selectedDestinations.includes(alt))
          .slice(0, 3),
      );
      setShowAlternatives(true);
    }

    // Simulate AI generation delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock itinerary
    const mockItinerary: DayItinerary[] = [
      {
        day: 1,
        date: travelDate,
        items: [
          {
            time: "09:00",
            activity: "Hotel Pick-up & Welcome Briefing",
            location: "Your Hotel",
            duration: "30 mins",
            type: "travel",
            notes: "Meet your multilingual driver and tour assistant",
          },
          {
            time: "09:30",
            activity: "Travel to First Destination",
            location: selectedDestinations[0] || "Nagoya Castle",
            duration: "45 mins",
            type: "travel",
          },
          {
            time: "10:15",
            activity: `Explore ${selectedDestinations[0] || "Nagoya Castle"}`,
            location: selectedDestinations[0] || "Nagoya Castle",
            duration: "2 hours",
            type: "sightseeing",
            notes:
              "Guided tour with historical insights and photo opportunities",
          },
          {
            time: "12:30",
            activity: "Traditional Japanese Lunch",
            location: "Local Restaurant",
            duration: "1 hour",
            type: "meal",
            notes: "Authentic cuisine experience with dietary accommodations",
          },
          {
            time: "14:00",
            activity: `Visit ${selectedDestinations[1] || "Legoland"}`,
            location: selectedDestinations[1] || "Legoland",
            duration: "3 hours",
            type: "activity",
            notes: "Interactive experience and family-friendly activities",
          },
          {
            time: "17:30",
            activity: `Evening at ${selectedDestinations[2] || "Oasis 21"}`,
            location: selectedDestinations[2] || "Oasis 21",
            duration: "1.5 hours",
            type: "sightseeing",
            notes: "Shopping and modern architecture exploration",
          },
          {
            time: "19:30",
            activity: "Return to Hotel",
            location: "Your Hotel",
            duration: "45 mins",
            type: "travel",
            notes: "Safe drop-off with tour summary and recommendations",
          },
        ],
        weather: mockWeather[
          selectedDestinations[0] as keyof typeof mockWeather
        ] || { condition: "Clear", temp: "24°C" },
      },
    ];

    setItinerary(mockItinerary);
    setIsGenerating(false);
  };

  const acceptAlternative = (alternative: string, replaceIndex: number) => {
    const newDestinations = [...selectedDestinations];
    newDestinations[replaceIndex] = alternative;
    setShowAlternatives(false);
    generateItinerary();
  };

  const exportToPDF = () => {
    // Mock PDF generation
    const pdfContent = `
UncleSam Tours - Personal Itinerary
Generated for ${travelers} passenger${travelers > 1 ? "s" : ""}
Travel Date: ${travelDate}

DESTINATIONS:
${selectedDestinations.map((dest, i) => `${i + 1}. ${dest}`).join("\n")}

DETAILED SCHEDULE:
${itinerary
  .map(
    (day) =>
      `Day ${day.day} (${day.date}):\n` +
      day.items
        .map(
          (item) =>
            `${item.time} - ${item.activity} at ${item.location} (${item.duration})`,
        )
        .join("\n"),
  )
  .join("\n\n")}

INCLUSIONS:
• 12-hour private tour with dedicated tour assistant
• Private van transportation with multilingual driver
• Gas and toll fees included
• Hotel pick-up and drop-off service
• Driver fluent in English, Japanese, and Tagalog

Contact: unclesamtourservices1988@gmail.com | +81 80-5331-1738
    `;

    const blob = new Blob([pdfContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `UncleSam-Tours-Itinerary-${travelDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "travel":
        return <Navigation className="w-4 h-4 text-blue-600" />;
      case "meal":
        return <Utensils className="w-4 h-4 text-green-600" />;
      case "sightseeing":
        return <Camera className="w-4 h-4 text-purple-600" />;
      case "activity":
        return <MapPin className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    return condition.toLowerCase().includes("rain") ? (
      <CloudRain className="w-4 h-4 text-blue-600" />
    ) : (
      <Sun className="w-4 h-4 text-yellow-600" />
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${
          isMinimized
            ? "w-96 h-16"
            : "w-[95%] h-[95%] sm:w-[90%] sm:h-[90%] lg:w-[80%] lg:h-[90%]"
        } max-w-6xl max-h-screen overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-red-600 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  AI Itinerary Planner
                </h2>
                <p className="text-red-100 text-sm sm:text-base">
                  Personalized tour planning for {travelers} passenger
                  {travelers > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-red-700"
              >
                {isMinimized ? (
                  <Maximize2 className="w-5 h-5" />
                ) : (
                  <Minimize2 className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-red-700"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden">
            {isGenerating ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Generating Your Personalized Itinerary
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Analyzing destinations, checking weather, and optimizing
                    your schedule...
                  </p>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce"></div>
                      <div
                        className="w-3 h-3 bg-red-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-red-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Weather Warnings */}
                  {weatherWarnings.length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold text-yellow-800 text-lg">
                            Weather Advisory
                          </h4>
                          <ul className="text-yellow-700 mt-2 space-y-1">
                            {weatherWarnings.map((warning, index) => (
                              <li key={index} className="text-base">
                                • {warning}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alternative Suggestions */}
                  {showAlternatives && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-4 text-lg">
                        Suggested Alternatives (Better Weather)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {alternatives.map((alternative, index) => (
                          <div
                            key={alternative}
                            className="bg-white p-4 rounded border shadow-sm"
                          >
                            <h5 className="font-medium text-gray-900 text-base">
                              {alternative}
                            </h5>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                acceptAlternative(alternative, index)
                              }
                              className="mt-3 w-full"
                            >
                              Replace {selectedDestinations[index]}
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => setShowAlternatives(false)}
                        variant="outline"
                        size="sm"
                        className="mt-4"
                      >
                        Keep Original Destinations
                      </Button>
                    </div>
                  )}

                  {/* Generated Itinerary */}
                  {itinerary.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="text-2xl font-bold text-gray-900">
                          Your Personalized Itinerary
                        </h3>
                        <Button
                          onClick={exportToPDF}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Export PDF
                        </Button>
                      </div>

                      {itinerary.map((day) => (
                        <Card
                          key={day.day}
                          className="border-gray-200 shadow-sm"
                        >
                          <CardHeader className="bg-gray-50 py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center space-x-3">
                                <Calendar className="w-6 h-6 text-red-600" />
                                <div>
                                  <h4 className="font-semibold text-lg">
                                    Day {day.day}
                                  </h4>
                                  <p className="text-gray-600">{day.date}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getWeatherIcon(day.weather.condition)}
                                <span className="text-gray-600">
                                  {day.weather.condition} • {day.weather.temp}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 sm:p-6">
                            <div className="space-y-4">
                              {day.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    {getActivityIcon(item.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                      <span className="font-medium text-gray-900 text-base">
                                        {item.time}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-xs w-fit"
                                      >
                                        {item.duration}
                                      </Badge>
                                    </div>
                                    <h5 className="font-semibold text-gray-900 text-base mb-1">
                                      {item.activity}
                                    </h5>
                                    <p className="text-gray-600 flex items-center text-base">
                                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                                      {item.location}
                                    </p>
                                    {item.notes && (
                                      <p className="text-gray-500 mt-2 text-sm italic">
                                        {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      {/* Package Inclusions Reminder */}
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 sm:p-6">
                          <h4 className="font-semibold text-green-900 mb-3 text-lg">
                            Included in Your Tour Package
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <ul className="text-green-800 space-y-2">
                              <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                12-hour private tour with dedicated tour
                                assistant
                              </li>
                              <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                Private van transportation
                              </li>
                              <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                Gas and toll fees included
                              </li>
                            </ul>
                            <ul className="text-green-800 space-y-2">
                              <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                Hotel pick-up and drop-off service
                              </li>
                              <li className="flex items-center">
                                <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                                Driver fluent in English, Japanese, and Tagalog
                              </li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
