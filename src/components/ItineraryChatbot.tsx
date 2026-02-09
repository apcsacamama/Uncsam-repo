import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import {
  MapPin, X, Bot, Calendar, Clock, Download, CloudRain, Sun,
  AlertTriangle, Camera, Utensils, Sparkles, Car,
  RotateCcw, Pencil, Trash2, Send, Umbrella, ArrowRightLeft
} from "lucide-react";

// --- TYPES ---
interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  duration: string;
  type: "travel" | "sightseeing" | "meal" | "activity";
  notes?: string;
  weatherWarning?: boolean;
}

interface DayItinerary {
  day: number;
  date: string;
  items: ItineraryItem[];
  weather: {
    condition: string;
    temp: string;
    summary: string;
  };
}

// Updated Interface to accept multi-day data
interface ItineraryChatbotProps {
  selectedDestinations: string[]; 
  customItinerary?: any[]; // <--- NEW: Receives the full day-by-day structure
  isVisible: boolean;
  onClose: () => void;
  travelDate: string;
  travelers: number;
}

// --- MOCK DATA ---
const MOCK_WEATHER_DB: Record<string, { condition: string; temp: string; icon: 'sun' | 'rain' | 'cloud' }> = {
  "Tokyo Tower": { condition: "Sunny", temp: "24°C", icon: 'sun' },
  "Nagoya Castle": { condition: "Sunny", temp: "25°C", icon: 'sun' },
  "Legoland Japan": { condition: "Cloudy", temp: "22°C", icon: 'cloud' },
  // ... (add more as needed)
};

const INDOOR_ALTERNATIVES = [
  "Toyota Commemorative Museum", "Nagoya City Science Museum", "SCMAGLEV and Railway Park"
];

// --- HELPER: Time Calculator ---
const addTime = (startTime: string, minutesToAdd: number): string => {
  const [hours, mins] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function ItineraryChatbot({
  selectedDestinations,
  customItinerary, // Now using this for multi-day logic
  isVisible,
  onClose,
  travelDate,
  travelers,
}: ItineraryChatbotProps) {
  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  
  // Data States
  const [currentItinerary, setCurrentItinerary] = useState<DayItinerary[]>([]);
  const [history, setHistory] = useState<DayItinerary[][]>([]); 
  const [revisionCount, setRevisionCount] = useState(0);
  const MAX_REVISIONS = 5;

  const [weatherWarnings, setWeatherWarnings] = useState<string[]>([]);
  const [weatherSuggestions, setWeatherSuggestions] = useState<{original: string, suggested: string}[]>([]);

  // Initial Generation
  useEffect(() => {
    if (isVisible && currentItinerary.length === 0) {
      generateItinerary(false); 
    }
  }, [isVisible]);

  // --- CORE GENERATOR LOGIC ---
  const generateItinerary = async (isRevision: boolean = false, customInstruction: string = "") => {
    if (isRevision && revisionCount >= MAX_REVISIONS) return;

    setIsGenerating(true);
    setWeatherSuggestions([]); 

    if (currentItinerary.length > 0) setHistory(prev => [...prev, currentItinerary]);

    // 1. DETERMINE DAYS TO PROCESS
    // If customItinerary exists, use it (Multi-day). Otherwise use selectedDestinations (Single Day/Standard).
    const daysData = (customItinerary && customItinerary.length > 0) 
        ? customItinerary 
        : [{ destinations: selectedDestinations, date: travelDate }];

    const generatedDays: DayItinerary[] = [];

    // 2. Simulate AI Thinking
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. LOOP THROUGH EACH DAY
    for (let i = 0; i < daysData.length; i++) {
        const dayData = daysData[i];
        const dayDestinations = dayData.destinations || [];
        
        // Format Date
        let dateDisplay = dayData.date;
        try {
             // If it's a date string/object, format it. If it's already formatted, keep it.
             if(dayData.date && !dayData.date.includes("|")) {
                 dateDisplay = format(new Date(dayData.date), "MMM dd, yyyy");
             }
        } catch(e) {}

        const dayItems: ItineraryItem[] = [];
        let currentTime = "09:00"; // Default start

        // Start Item
        dayItems.push({
            id: `day${i}-start`,
            time: currentTime,
            activity: "Hotel Pick-up",
            location: "Your Stay",
            duration: "30 mins",
            type: "travel"
        });
        currentTime = addTime(currentTime, 30);

        // Process Destinations for this day
        dayDestinations.forEach((dest: string, idx: number) => {
            // Travel
            dayItems.push({
                id: `day${i}-travel-${idx}`,
                time: currentTime,
                activity: `Travel to ${dest}`,
                location: "Private Van",
                duration: "30 mins",
                type: "travel"
            });
            currentTime = addTime(currentTime, 30);

            // Visit
            const weather = MOCK_WEATHER_DB[dest];
            const isRainy = weather?.condition.toLowerCase().includes("rain");
            
            dayItems.push({
                id: `day${i}-visit-${idx}`,
                time: currentTime,
                activity: `Explore ${dest}`,
                location: dest,
                duration: "1h 30m",
                type: "sightseeing",
                notes: isRainy ? "⚠️ Rain forecast" : undefined,
                weatherWarning: isRainy
            });
            currentTime = addTime(currentTime, 90);

            // Lunch Logic (Insert around 12pm - 1pm)
            const hour = parseInt(currentTime.split(':')[0]);
            if (hour >= 12 && hour <= 13 && !dayItems.some(item => item.type === 'meal')) {
                dayItems.push({
                    id: `day${i}-lunch`,
                    time: currentTime,
                    activity: "Lunch Break",
                    location: "Local Spot",
                    duration: "1 hour",
                    type: "meal"
                });
                currentTime = addTime(currentTime, 60);
            }
        });

        // End Item
        dayItems.push({
            id: `day${i}-end`,
            time: currentTime,
            activity: "Drop-off at Hotel",
            location: "Your Stay",
            duration: "30 mins",
            type: "travel"
        });

        // Add to Days Array
        generatedDays.push({
            day: i + 1,
            date: dateDisplay || `Day ${i + 1}`,
            items: dayItems,
            weather: { condition: "Sunny", temp: "24°C", summary: "Great weather for travel" }
        });
    }

    setCurrentItinerary(generatedDays);
    if (isRevision) setRevisionCount(prev => prev + 1);
    setIsGenerating(false);
    setPrompt(""); 
  };

  // --- ACTIONS (Simplified for brevity) ---
  const handleUndo = () => {
    if (history.length === 0) return;
    setCurrentItinerary(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setRevisionCount(prev => Math.max(0, prev - 1));
  };

  const exportToPDF = () => alert("Downloading Itinerary PDF...");

  const handleSubmitPrompt = (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) generateItinerary(true, prompt);
  };

  // --- RENDER HELPERS ---
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "travel": return <Car className="w-4 h-4 text-blue-600" />;
      case "meal": return <Utensils className="w-4 h-4 text-green-600" />;
      case "sightseeing": return <Camera className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    return condition.toLowerCase().includes("rain") ? <CloudRain className="w-6 h-6 text-blue-200" /> : <Sun className="w-6 h-6 text-yellow-300" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-2xl w-[95%] h-[95%] sm:w-[90%] sm:h-[90%] lg:w-[80%] lg:h-[90%] max-w-6xl max-h-screen overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full"><Bot className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">AI Itinerary Planner</h2>
                <p className="text-red-100 text-sm">Interactive Assistant (12-Hour Exclusive)</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <Badge variant={revisionCount >= MAX_REVISIONS ? "destructive" : "secondary"} className="text-xs">
                      Revisions: {revisionCount}/{MAX_REVISIONS}
                  </Badge>
                  {history.length > 0 && <Button variant="outline" size="sm" onClick={handleUndo} className="h-8"><RotateCcw className="w-3 h-3 mr-2" /> Undo</Button>}
              </div>
              <Button onClick={exportToPDF} variant="outline" size="sm" className="h-8"><Download className="w-3 h-3 mr-2" /> Save PDF</Button>
          </div>

          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Sparkles className="w-12 h-12 text-red-600 mb-4 animate-spin" />
                      <h3 className="text-xl font-bold text-gray-900">Optimizing Schedule...</h3>
                      <p className="text-gray-500 text-sm">Analyzing {customItinerary ? customItinerary.length : 1} days of travel</p>
                  </div>
              ) : (
                  <>
                      {/* Weather Header (Shows Day 1 Forecast) */}
                      {currentItinerary.length > 0 && (
                          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-6 text-white shadow-lg relative overflow-hidden">
                              <div className="flex justify-between items-start relative z-10">
                                  <div>
                                      <h3 className="font-bold text-lg flex items-center gap-2">
                                          {getWeatherIcon(currentItinerary[0].weather.condition)}
                                          {currentItinerary[0].date} Forecast
                                      </h3>
                                      <p className="text-blue-100 mt-1">Overall condition for your trip start.</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="text-3xl font-bold">{currentItinerary[0].weather.temp}</span>
                                      <p className="text-xs text-blue-100 uppercase font-semibold">{currentItinerary[0].weather.condition}</p>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* Day Cards Loop */}
                      {currentItinerary.map((day) => (
                          <Card key={day.day} className="border-gray-200 shadow-md">
                              <CardHeader className="bg-white border-b py-3 px-4">
                                  <div className="flex items-center gap-2">
                                      <Calendar className="w-5 h-5 text-red-600"/>
                                      <span className="font-bold text-gray-800">Day {day.day} Timeline ({day.date})</span>
                                  </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                  <div className="divide-y divide-gray-100">
                                      {day.items.map((item) => (
                                          <div key={item.id} className={`flex p-4 hover:bg-gray-50 transition-colors ${item.weatherWarning ? "bg-yellow-50" : ""}`}>
                                              <div className="w-16 pt-1 text-center mr-4">
                                                  <span className="text-sm font-bold text-gray-900">{item.time}</span>
                                              </div>
                                              <div className="flex-1">
                                                  <h5 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                      {getActivityIcon(item.type)} {item.activity}
                                                  </h5>
                                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                      <Clock className="w-3 h-3"/> {item.duration} | <MapPin className="w-3 h-3"/> {item.location}
                                                  </p>
                                                  {item.notes && <Badge variant="outline" className="mt-2 text-[10px]">{item.notes}</Badge>}
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </CardContent>
                          </Card>
                      ))}
                  </>
              )}
          </div>

          {/* Chat Input */}
          <div className="p-4 bg-white border-t">
              <form onSubmit={handleSubmitPrompt} className="flex gap-2">
                  <Input 
                      value={prompt} 
                      onChange={(e) => setPrompt(e.target.value)} 
                      placeholder="Ask AI to change something..." 
                      disabled={isGenerating}
                  />
                  <Button type="submit" disabled={isGenerating || !prompt.trim()} className="bg-red-600 text-white">
                      <Send className="w-4 h-4" />
                  </Button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
}