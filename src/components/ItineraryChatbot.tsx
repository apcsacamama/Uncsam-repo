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
  Maximize2,
  Minimize2,
  Sparkles,
  Car,
  RotateCcw, // Undo icon
  RefreshCw, // Revise icon
  Pencil,    // Edit icon
  Trash2,    // Delete icon
  Send       // Send icon
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  
  // Data States
  const [currentItinerary, setCurrentItinerary] = useState<DayItinerary[]>([]);
  const [history, setHistory] = useState<DayItinerary[][]>([]); // Undo stack
  const [revisionCount, setRevisionCount] = useState(0);
  const MAX_REVISIONS = 3;

  const [weatherWarnings, setWeatherWarnings] = useState<string[]>([]);
  
  // Manual Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // 1. MOCK WEATHER DATA (Expanded)
  const mockWeather: Record<string, { condition: string; temp: string; warning?: string }> = {
    "Tokyo Tower": { condition: "Sunny", temp: "24°C" },
    "TeamLab Planets": { condition: "Rain", temp: "19°C", warning: "Indoor activity recommended due to rain" },
    "Bamboo Grove": { condition: "Rain", temp: "18°C", warning: "Slippery paths expected" },
    "Universal Studios": { condition: "Sunny", temp: "26°C" },
    "Nagoya Castle": { condition: "Sunny", temp: "24°C" },
    "Legoland Japan": { condition: "Partly Cloudy", temp: "22°C" },
    "Ghibli Park": { condition: "Sunny", temp: "23°C" },
    "Oasis 21": { condition: "Clear", temp: "21°C" },
  };

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

    // 1. Save History (Undo capability)
    if (currentItinerary.length > 0) {
        setHistory(prev => [...prev, currentItinerary]);
    }

    // 2. Analyze Weather
    const warnings: string[] = [];
    selectedDestinations.forEach((destName) => {
      const weatherKey = Object.keys(mockWeather).find(k => destName.includes(k) || k.includes(destName));
      const weather = weatherKey ? mockWeather[weatherKey] : { condition: "Sunny", temp: "22°C" };
      if (weather?.warning) warnings.push(`${destName}: ${weather.warning}`);
    });
    setWeatherWarnings(warnings);

    // 3. Simulate AI "Thinking"
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Build/Rebuild Itinerary Items
    const generatedItems: ItineraryItem[] = [];
    let currentTime = customInstruction.toLowerCase().includes("start later") ? "10:00" : "09:00";
    let hasHadLunch = false;

    // Start
    generatedItems.push({
      id: "start-1",
      time: currentTime,
      activity: "Hotel Pick-up",
      location: "Your Hotel",
      duration: "30 mins",
      type: "travel",
      notes: "Driver arrival & briefing"
    });
    currentTime = addTime(currentTime, 30);

    // Shuffle logic for "Revision" simulation (Move last item to first)
    let destsToMap = [...selectedDestinations];
    if (isRevision && !customInstruction) {
        const last = destsToMap.pop();
        if (last) destsToMap.unshift(last);
    }

    destsToMap.forEach((dest, index) => {
        // Travel
        generatedItems.push({
            id: `travel-${index}`,
            time: currentTime,
            activity: `Travel to ${dest}`,
            location: "En route",
            duration: "45 mins",
            type: "travel"
        });
        currentTime = addTime(currentTime, 45);

        // Activity
        generatedItems.push({
            id: `visit-${index}`,
            time: currentTime,
            activity: `Explore ${dest}`,
            location: dest,
            duration: "1h 30m",
            type: "sightseeing",
            notes: warnings.some(w => w.includes(dest)) ? "⚠️ Weather Warning: Indoor paths preferred" : "Guided tour"
        });
        currentTime = addTime(currentTime, 90);

        // Lunch Logic
        const currentHour = parseInt(currentTime.split(':')[0]);
        if (currentHour >= 12 && !hasHadLunch) {
            generatedItems.push({
                id: "lunch-1",
                time: currentTime,
                activity: customInstruction.toLowerCase().includes("sushi") ? "Sushi Omakase Lunch" : "Traditional Local Lunch",
                location: "Local Restaurant",
                duration: "1 hour",
                type: "meal",
                notes: "Dietary restrictions accommodated"
            });
            currentTime = addTime(currentTime, 60);
            hasHadLunch = true;
        }
    });

    // End
    generatedItems.push({
        id: "end-1",
        time: currentTime,
        activity: "Return to Hotel",
        location: "Your Hotel",
        duration: "45 mins",
        type: "travel",
        notes: "Tour conclusion"
    });

    const newDay: DayItinerary = {
        day: 1,
        date: travelDate,
        items: generatedItems,
        weather: { condition: "Sunny", temp: "24°C" }, // Default if not overridden
    };

    setCurrentItinerary([newDay]);
    if (isRevision) setRevisionCount(prev => prev + 1);
    
    setIsGenerating(false);
    setPrompt(""); // Clear input
  };

  // --- ACTIONS ---
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
    return condition.toLowerCase().includes("rain") ? <CloudRain className="w-4 h-4 text-blue-600" /> : <Sun className="w-4 h-4 text-yellow-600" />;
  };

  const exportToPDF = () => {
      alert("Downloading Itinerary PDF...");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${isMinimized ? "w-96 h-16" : "w-[95%] h-[95%] sm:w-[90%] sm:h-[90%] lg:w-[80%] lg:h-[90%]"} max-w-6xl max-h-screen overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full"><Bot className="w-6 h-6 text-white" /></div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">AI Itinerary Planner</h2>
                <p className="text-red-100 text-sm">Review, Revise, and Finalize your trip</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)} className="text-white hover:bg-white/20">
                {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
            
            {/* Toolbar */}
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Badge variant={revisionCount >= MAX_REVISIONS ? "destructive" : "secondary"} className="text-xs">
                        Revisions: {revisionCount}/{MAX_REVISIONS}
                    </Badge>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleUndo} 
                        disabled={history.length === 0}
                        className="text-gray-600 h-8"
                    >
                        <RotateCcw className="w-3 h-3 mr-2" /> Undo Changes
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={exportToPDF} variant="outline" size="sm" className="h-8">
                        <Download className="w-3 h-3 mr-2" /> Save PDF
                    </Button>
                </div>
            </div>

            {/* Scrollable Itinerary View */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Sparkles className="w-12 h-12 text-red-600 mb-4 animate-spin" />
                        <h3 className="text-xl font-bold text-gray-900">Optimizing Schedule...</h3>
                        <p className="text-gray-500 text-sm">Checking travel times and weather conditions</p>
                    </div>
                ) : (
                    <>
                        {/* Weather Warnings Block */}
                        {weatherWarnings.length > 0 && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
                                <div className="flex items-start space-x-3">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 text-sm">Weather Advisory</h4>
                                        <ul className="text-xs text-yellow-700 mt-1 list-disc pl-4">
                                            {weatherWarnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Itinerary Cards */}
                        {currentItinerary.map((day, dayIndex) => (
                            <Card key={day.day} className="border-gray-200 shadow-md overflow-hidden">
                                <CardHeader className="bg-white border-b py-3 px-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-red-600"/>
                                            <span className="font-bold text-gray-800">Day {day.day} - {day.date}</span>
                                        </div>
                                        {/* WEATHER FORECAST IN TOP (Restored) */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full border">
                                            {getWeatherIcon(day.weather.condition)}
                                            <span>{day.weather.condition} • {day.weather.temp}</span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-gray-100">
                                        {day.items.map((item, index) => (
                                            <div key={item.id} className="flex p-4 hover:bg-gray-50 transition-colors group relative">
                                                {/* Time */}
                                                <div className="flex flex-col items-center mr-4 w-16 pt-1">
                                                    <span className="text-sm font-bold text-gray-900">{item.time}</span>
                                                    <div className="h-full w-0.5 bg-gray-200 mt-2 group-last:hidden"></div>
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 pb-2">
                                                    <div className="flex justify-between items-start">
                                                        <div className="w-full">
                                                            {editingItemId === item.id ? (
                                                                <div className="flex gap-2 mb-2 w-full">
                                                                    <Input 
                                                                        value={editValue} 
                                                                        onChange={(e) => setEditValue(e.target.value)} 
                                                                        className="h-8 text-sm"
                                                                    />
                                                                    <Button size="sm" onClick={() => handleManualEditSave(dayIndex)} className="h-8 bg-green-600">Save</Button>
                                                                    <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8">Cancel</Button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getActivityIcon(item.type)}
                                                                    <h5 className="font-bold text-gray-800 text-sm sm:text-base">{item.activity}</h5>
                                                                </div>
                                                            )}
                                                            
                                                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mb-1">
                                                                <Clock className="w-3 h-3"/> {item.duration} 
                                                                <span className="mx-1 text-gray-300">|</span> 
                                                                <MapPin className="w-3 h-3"/> {item.location}
                                                            </p>
                                                            {item.notes && (
                                                                <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border-blue-100 font-normal">
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

            {/* Chat/Instruction Input */}
            <div className="p-4 bg-white border-t">
                <form onSubmit={handleSubmitPrompt} className="flex gap-2">
                    <Input 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Tell AI to adjust itinerary (e.g., 'Make lunch later', 'Remove Temple')..."
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
                    <span>AI Assistant active</span>
                    <span>{MAX_REVISIONS - revisionCount} revisions remaining</span>
                </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}