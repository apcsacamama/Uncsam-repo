import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
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
  Sparkles,
  Car,
  RotateCcw, 
  RefreshCw, 
  Pencil,    
  Trash2,    
  Send,
  Umbrella,
  ArrowRightLeft
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

interface ItineraryChatbotProps {
  selectedDestinations: string[]; 
  isVisible: boolean;
  onClose: () => void;
  travelDate: string;
  travelers: number;
}

// --- MOCK DATA ---
const MOCK_WEATHER_DB: Record<string, { condition: string; temp: string; icon: 'sun' | 'rain' | 'cloud' }> = {
  "Tokyo Tower": { condition: "Sunny", temp: "24°C", icon: 'sun' },
  "TeamLab Planets": { condition: "Rain", temp: "19°C", icon: 'rain' }, 
  "Bamboo Grove": { condition: "Heavy Rain", temp: "18°C", icon: 'rain' },
  "Fushimi Inari": { condition: "Rain", temp: "20°C", icon: 'rain' },
  "Nagoya Castle": { condition: "Sunny", temp: "25°C", icon: 'sun' },
  "Legoland Japan": { condition: "Cloudy", temp: "22°C", icon: 'cloud' },
  "Ghibli Park": { condition: "Sunny", temp: "23°C", icon: 'sun' },
  "Oasis 21": { condition: "Clear", temp: "21°C", icon: 'sun' },
};

const INDOOR_ALTERNATIVES = [
  "Toyota Commemorative Museum",
  "Nagoya City Science Museum",
  "SCMAGLEV and Railway Park",
  "Noritake Garden (Craft Center)",
  "Tokugawa Art Museum"
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
  
  // Limit to 5 revisions
  const MAX_REVISIONS = 5;

  const [weatherWarnings, setWeatherWarnings] = useState<string[]>([]);
  const [feasibilityIssue, setFeasibilityIssue] = useState<string | null>(null);
  
  // Manual Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Suggestions State
  const [weatherSuggestions, setWeatherSuggestions] = useState<{original: string, suggested: string}[]>([]);

  // Initial Generation
  useEffect(() => {
    if (isVisible && selectedDestinations.length > 0 && currentItinerary.length === 0) {
      generateItinerary(false); 
    }
  }, [isVisible, selectedDestinations]);

  // --- CORE GENERATOR LOGIC ---
  const generateItinerary = async (isRevision: boolean = false, customInstruction: string = "") => {
    if (isRevision && revisionCount >= MAX_REVISIONS) return;

    setIsGenerating(true);
    setWeatherSuggestions([]); 
    setFeasibilityIssue(null);

    // 1. Save History
    if (currentItinerary.length > 0) {
        setHistory(prev => [...prev, currentItinerary]);
    }

    // 2. Feasibility Logic
    const estTime = (selectedDestinations.length * 1.5) + (selectedDestinations.length * 0.75) + 1;
    if (estTime > 12) {
        setFeasibilityIssue(`⚠️ Time Warning: You selected ${selectedDestinations.length} spots. Since travel time is included in your 12-hour booking, this might be rushed.`);
    }

    // 3. Analyze Weather
    const suggestions: {original: string, suggested: string}[] = [];
    const usedAlternatives = new Set<string>();
    const warnings: string[] = [];

    selectedDestinations.forEach(dest => {
       const weather = MOCK_WEATHER_DB[dest] || { condition: "Sunny", temp: "24°C" };
       
       if (weather.condition.toLowerCase().includes("rain")) {
           warnings.push(`${dest}: ${weather.condition}`);
           const alt = INDOOR_ALTERNATIVES.find(a => !selectedDestinations.includes(a) && !usedAlternatives.has(a));
           if (alt) {
               suggestions.push({ original: dest, suggested: alt });
               usedAlternatives.add(alt);
           }
       }
    });
    setWeatherWarnings(warnings);
    setWeatherSuggestions(suggestions);

    // 4. Simulate AI "Thinking"
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. Build Itinerary Items
    const generatedItems: ItineraryItem[] = [];
    
    // Default start is 06:00 AM
    let currentTime = customInstruction.toLowerCase().includes("start at") 
        ? customInstruction.split("start at")[1].trim().split(" ")[0] 
        : "06:00"; 
    
    if (!currentTime.includes(":")) currentTime = "06:00"; 

    let hasHadLunch = false;

    // Start - Explicit Pick-up
    generatedItems.push({
      id: "start-1",
      time: currentTime,
      activity: "Hotel/Accommodation Pick-up",
      location: "Your Stay",
      duration: "30 mins",
      type: "travel",
      notes: "Driver arrival & briefing"
    });
    currentTime = addTime(currentTime, 30);

    // Destinations Loop
    const destsToMap = isRevision ? [...selectedDestinations].reverse() : selectedDestinations;

    destsToMap.forEach((dest, index) => {
        // Calculate Travel Time
        generatedItems.push({
            id: `travel-${index}`,
            time: currentTime,
            activity: `Travel to ${dest}`,
            location: "En route",
            duration: "45 mins",
            type: "travel"
        });
        currentTime = addTime(currentTime, 45);

        // Visit
        const weather = MOCK_WEATHER_DB[dest];
        const isRainy = weather?.condition.toLowerCase().includes("rain");

        generatedItems.push({
            id: `visit-${index}`,
            time: currentTime,
            activity: `Explore ${dest}`,
            location: dest,
            duration: "1h 30m",
            type: "sightseeing",
            notes: isRainy ? "⚠️ Rain expected. Bring umbrella." : "Guided tour",
            weatherWarning: isRainy
        });
        currentTime = addTime(currentTime, 90);

        // Lunch Logic
        const currentHour = parseInt(currentTime.split(':')[0]);
        if (currentHour >= 11 && currentHour <= 14 && !hasHadLunch) {
            generatedItems.push({
                id: "lunch-1",
                time: currentTime,
                activity: "Lunch Break",
                location: "Local Restaurant",
                duration: "1 hour",
                type: "meal",
                notes: "Local cuisine"
            });
            currentTime = addTime(currentTime, 60);
            hasHadLunch = true;
        }
    });

    // End
    generatedItems.push({
        id: "end-1",
        time: currentTime,
        activity: "Drop-off at Hotel",
        location: "Your Stay",
        duration: "45 mins",
        type: "travel",
        notes: "End of 12-hour service"
    });

    const newDay: DayItinerary = {
        day: 1,
        date: travelDate,
        items: generatedItems,
        weather: { 
            condition: suggestions.length > 0 ? "Rainy" : "Sunny", 
            temp: "24°C",
            summary: suggestions.length > 0 ? "Rain showers expected. Indoor backups available." : "Perfect weather for sightseeing."
        }, 
    };

    setCurrentItinerary([newDay]);
    if (isRevision) setRevisionCount(prev => prev + 1);
    
    setIsGenerating(false);
    setPrompt(""); 
  };

  // --- ACTIONS ---
  const handleSwapDestination = (original: string, suggested: string) => {
      setHistory(prev => [...prev, currentItinerary]);

      const newItinerary = [...currentItinerary];
      newItinerary[0].items = newItinerary[0].items.map(item => {
          if (item.activity.includes(original)) {
              return {
                  ...item,
                  activity: item.activity.replace(original, suggested),
                  location: suggested,
                  notes: "Replaced due to weather",
                  weatherWarning: false 
              };
          }
          if (item.activity.includes(`Travel to ${original}`)) {
              return { ...item, activity: `Travel to ${suggested}` };
          }
          return item;
      });

      setWeatherSuggestions(prev => prev.filter(s => s.original !== original));
      setCurrentItinerary(newItinerary);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setCurrentItinerary(previous);
    setHistory(prev => prev.slice(0, -1));
    setRevisionCount(prev => Math.max(0, prev - 1));
  };

  const handleManualEditSave = (dayIndex: number) => {
      if (!editingItemId) return;
      const newItinerary = [...currentItinerary];
      const itemIndex = newItinerary[dayIndex].items.findIndex(i => i.id === editingItemId);
      if (itemIndex > -1) {
          newItinerary[dayIndex].items[itemIndex].activity = editValue;
          setCurrentItinerary(newItinerary);
      }
      setEditingItemId(null);
  };

  const handleManualDelete = (dayIndex: number, itemId: string) => {
      if(!confirm("Remove this item?")) return;
      const newItinerary = [...currentItinerary];
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter(i => i.id !== itemId);
      setCurrentItinerary(newItinerary);
  };

  const handleSubmitPrompt = (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim()) return;
      generateItinerary(true, prompt);
  };

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

  const exportToPDF = () => {
      alert("Downloading Itinerary PDF...");
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
          
          {/* Toolbar */}
          <div className="bg-white border-b px-4 py-3 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                  <Badge variant={revisionCount >= MAX_REVISIONS ? "destructive" : "secondary"} className="text-xs">
                      Revisions: {revisionCount}/{MAX_REVISIONS}
                  </Badge>
                  {history.length > 0 && (
                      <Button variant="outline" size="sm" onClick={handleUndo} className="text-gray-600 h-8">
                          <RotateCcw className="w-3 h-3 mr-2" /> Undo
                      </Button>
                  )}
              </div>
              <Button onClick={exportToPDF} variant="outline" size="sm" className="h-8">
                  <Download className="w-3 h-3 mr-2" /> Save PDF
              </Button>
          </div>

          {/* Scrollable Itinerary View */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              
              {isGenerating ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Sparkles className="w-12 h-12 text-red-600 mb-4 animate-spin" />
                      <h3 className="text-xl font-bold text-gray-900">Optimizing Schedule...</h3>
                      <p className="text-gray-500 text-sm">Checking travel times, traffic, and weather conditions</p>
                  </div>
              ) : (
                  <>
                      {/* 1. Feasibility Alert */}
                      {feasibilityIssue && (
                          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-md flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                              <div>
                                  <h4 className="font-bold text-orange-800">Time Constraint Alert</h4>
                                  <p className="text-sm text-orange-700">{feasibilityIssue}</p>
                              </div>
                          </div>
                      )}

                      {/* 2. Weather Dashboard */}
                      {currentItinerary.length > 0 && (
                          <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-6 text-white shadow-lg relative overflow-hidden">
                              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                              <div className="absolute top-10 left-10 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>

                              <div className="flex justify-between items-start relative z-10">
                                  <div>
                                      <h3 className="font-bold text-lg flex items-center gap-2">
                                          {getWeatherIcon(currentItinerary[0].weather.condition)}
                                          {travelDate} Forecast
                                      </h3>
                                      <p className="text-blue-100 mt-1">{currentItinerary[0].weather.summary}</p>
                                  </div>
                                  <div className="text-right">
                                      <span className="text-3xl font-bold">{currentItinerary[0].weather.temp}</span>
                                      <p className="text-xs text-blue-100 uppercase font-semibold tracking-wider">{currentItinerary[0].weather.condition}</p>
                                  </div>
                              </div>

                              {/* Suggestions */}
                              {weatherSuggestions.length > 0 && (
                                  <div className="mt-6 bg-white/10 rounded-lg p-3 border border-white/20 backdrop-blur-sm">
                                      <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                                          <AlertTriangle className="w-4 h-4 text-yellow-300" />
                                          Bad Weather Detected. AI Suggests:
                                      </h4>
                                      <div className="space-y-2">
                                          {weatherSuggestions.map((sug, idx) => (
                                              <div key={idx} className="flex items-center justify-between bg-white/90 text-gray-800 p-2 rounded text-sm shadow-sm">
                                                  <div className="flex items-center gap-2">
                                                      <span className="line-through text-gray-400">{sug.original}</span>
                                                      <ArrowRightLeft className="w-3 h-3 text-blue-500" />
                                                      <span className="font-bold text-blue-700 flex items-center">
                                                          <Umbrella className="w-3 h-3 mr-1" /> {sug.suggested}
                                                      </span>
                                                  </div>
                                                  <Button 
                                                      size="sm" 
                                                      className="h-7 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                                      onClick={() => handleSwapDestination(sug.original, sug.suggested)}
                                                  >
                                                      Swap Now
                                                  </Button>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              )}
                          </div>
                      )}

                      {/* 3. Itinerary Cards */}
                      {currentItinerary.map((day, dayIndex) => (
                          <Card key={day.day} className="border-gray-200 shadow-md overflow-hidden">
                              <CardHeader className="bg-white border-b py-3 px-4">
                                  <div className="flex justify-between items-center">
                                      <div className="flex items-center gap-2">
                                          <Calendar className="w-5 h-5 text-red-600"/>
                                          <span className="font-bold text-gray-800">Day {day.day} Timeline</span>
                                      </div>
                                  </div>
                              </CardHeader>
                              <CardContent className="p-0">
                                  <div className="divide-y divide-gray-100">
                                      {day.items.map((item, index) => (
                                          <div key={item.id} className={`flex p-4 hover:bg-gray-50 transition-colors group relative ${item.weatherWarning ? "bg-yellow-50/50" : ""}`}>
                                              {/* Time */}
                                              <div className="flex flex-col items-center mr-4 w-16 pt-1">
                                                  <span className="text-sm font-bold text-gray-900">{item.time}</span>
                                                  <div className="h-full w-0.5 bg-gray-200 mt-2 group-last:hidden"></div>
                                              </div>

                                              {/* Details */}
                                              <div className="flex-1 pb-2">
                                                  <div className="flex justify-between items-start">
                                                      <div className="w-full">
                                                          {/* Edit Mode */}
                                                          {editingItemId === item.id ? (
                                                              <div className="flex gap-2 mb-2 w-full">
                                                                  <Input 
                                                                      value={editValue} 
                                                                      onChange={(e) => setEditValue(e.target.value)} 
                                                                      className="h-8 text-sm bg-white"
                                                                  />
                                                                  <Button size="sm" onClick={() => handleManualEditSave(dayIndex)} className="h-8 bg-green-600">Save</Button>
                                                                  <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8">Cancel</Button>
                                                              </div>
                                                          ) : (
                                                              <h5 className="font-bold text-gray-800 text-sm sm:text-base mb-1 flex items-center gap-2">
                                                                  {item.activity}
                                                                  {item.type === 'meal' && <Utensils className="w-3 h-3 text-gray-400"/>}
                                                                  {item.type === 'travel' && <Car className="w-3 h-3 text-gray-400"/>}
                                                              </h5>
                                                          )}
                                                          
                                                          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mb-1">
                                                              <Clock className="w-3 h-3"/> {item.duration} 
                                                              <span className="mx-1 text-gray-300">|</span> 
                                                              <MapPin className="w-3 h-3"/> {item.location}
                                                          </p>
                                                          {item.notes && (
                                                              <Badge variant="secondary" className={`text-[10px] font-normal border ${item.weatherWarning ? "bg-yellow-100 text-yellow-800 border-yellow-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                                                                  {item.notes}
                                                              </Badge>
                                                          )}
                                                      </div>

                                                      {/* Action Buttons */}
                                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-4 bg-white shadow-sm border rounded p-1">
                                                          <button onClick={() => { setEditingItemId(item.id); setEditValue(item.activity); }} className="p-1 hover:bg-gray-100 rounded text-blue-600">
                                                              <Pencil className="w-3.5 h-3.5" />
                                                          </button>
                                                          <button onClick={() => handleManualDelete(dayIndex, item.id)} className="p-1 hover:bg-gray-100 rounded text-red-600">
                                                              <Trash2 className="w-3.5 h-3.5" />
                                                          </button>
                                                      </div>
                                                  </div>
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
                      placeholder="Ask AI to change something (e.g., 'Swap lunch spot')..."
                      disabled={isGenerating || revisionCount >= MAX_REVISIONS}
                      className="flex-1"
                  />
                  <Button 
                      type="submit" 
                      disabled={isGenerating || !prompt.trim() || revisionCount >= MAX_REVISIONS}
                      className="bg-red-600 hover:bg-red-700 text-white"
                  >
                      {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
              </form>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400 px-1">
                  <span>AI Assistant active (12hr Exclusive)</span>
                  <span>{MAX_REVISIONS - revisionCount} revisions remaining</span>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}