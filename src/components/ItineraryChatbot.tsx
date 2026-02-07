import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input"; // Assuming you have this
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
  RotateCcw, // For Undo/Revert
  RefreshCw, // For Revise
  Pencil,    // For Edit
  Trash2,    // For Delete
  Plus       // For Add
} from "lucide-react";

// --- TYPES ---
interface ItineraryItem {
  id: string; // Unique ID for editing
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

// --- HELPER: Time Add ---
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
  
  // Data States
  const [currentItinerary, setCurrentItinerary] = useState<DayItinerary[]>([]);
  const [history, setHistory] = useState<DayItinerary[][]>([]); // Stores past versions
  const [revisionCount, setRevisionCount] = useState(0);
  const MAX_REVISIONS = 3;

  const [weatherWarnings, setWeatherWarnings] = useState<string[]>([]);
  const [feasibilityIssue, setFeasibilityIssue] = useState<string | null>(null);

  // Edit Mode State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // 1. MOCK WEATHER DATA
  const mockWeather: Record<string, { condition: string; temp: string; warning?: string }> = {
    "Tokyo Tower": { condition: "Sunny", temp: "24°C" },
    "TeamLab Planets": { condition: "Rain", temp: "19°C", warning: "Indoor recommended" },
    "Bamboo Grove": { condition: "Rain", temp: "18°C", warning: "Slippery paths" },
    "Nagoya Castle": { condition: "Sunny", temp: "24°C" },
    "Legoland Japan": { condition: "Partly Cloudy", temp: "22°C" },
  };

  // Initial Generation
  useEffect(() => {
    if (isVisible && selectedDestinations.length > 0 && currentItinerary.length === 0) {
      generateItinerary(false); // False means "Initial generation", not a revision
    }
  }, [isVisible, selectedDestinations]);

  // --- CORE LOGIC: GENERATOR ---
  const generateItinerary = async (isRevision: boolean = false) => {
    if (isRevision && revisionCount >= MAX_REVISIONS) return;

    setIsGenerating(true);
    setFeasibilityIssue(null);

    // 1. Save current state to history before changing it (if revising)
    if (currentItinerary.length > 0) {
        setHistory(prev => [...prev, currentItinerary]);
    }

    // 2. Weather Check
    const warnings: string[] = [];
    selectedDestinations.forEach((destName) => {
      const weatherKey = Object.keys(mockWeather).find(k => destName.includes(k));
      const weather = weatherKey ? mockWeather[weatherKey] : null;
      if (weather?.warning) warnings.push(`${destName}: ${weather.warning}`);
    });
    setWeatherWarnings(warnings);

    // 3. Feasibility Check
    const estTime = (selectedDestinations.length * 1.5) + (selectedDestinations.length * 0.75) + 1;
    if (estTime > 12) setFeasibilityIssue(`Tight schedule: ~${estTime.toFixed(1)} hrs needed for 12hr slot.`);

    // Simulate Delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 4. Build Itinerary Items
    // If revising, we shuffle the destinations array slightly to simulate "Optimization"
    const destsToMap = isRevision 
        ? [...selectedDestinations].reverse() // Simple mock logic: reverse order for revision
        : selectedDestinations;

    const generatedItems: ItineraryItem[] = [];
    let currentTime = "09:00";
    let hasHadLunch = false;

    // Start
    generatedItems.push({
      id: "start-1",
      time: currentTime,
      activity: "Hotel Pick-up",
      location: "Your Hotel",
      duration: "30 mins",
      type: "travel",
      notes: "Driver arrival"
    });
    currentTime = addTime(currentTime, 30);

    // Destinations
    destsToMap.forEach((dest, index) => {
        generatedItems.push({
            id: `travel-${index}`,
            time: currentTime,
            activity: `Travel to ${dest}`,
            location: "En route",
            duration: "45 mins",
            type: "travel"
        });
        currentTime = addTime(currentTime, 45);

        generatedItems.push({
            id: `visit-${index}`,
            time: currentTime,
            activity: `Explore ${dest}`,
            location: dest,
            duration: "1h 30m",
            type: "sightseeing",
            notes: warnings.some(w => w.includes(dest)) ? "Weather alert: Bring umbrella" : "Guided tour"
        });
        currentTime = addTime(currentTime, 90);

        const currentHour = parseInt(currentTime.split(':')[0]);
        if (currentHour >= 12 && !hasHadLunch) {
            generatedItems.push({
                id: "lunch-1",
                time: currentTime,
                activity: "Lunch Break",
                location: "Local Restaurant",
                duration: "1 hour",
                type: "meal",
                notes: "Recommended: Ramen or Sushi"
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
        weather: { condition: "Clear", temp: "24°C" },
    };

    setCurrentItinerary([newDay]);
    if (isRevision) setRevisionCount(prev => prev + 1);
    setIsGenerating(false);
  };

  // --- ACTIONS: REVERT / UNDO ---
  const handleRevert = () => {
    if (history.length === 0) return;
    const previousVersion = history[history.length - 1];
    
    setCurrentItinerary(previousVersion);
    setHistory(prev => prev.slice(0, -1)); // Remove last entry
    setRevisionCount(prev => Math.max(0, prev - 1)); // Give back a revision credit
  };

  // --- ACTIONS: MANUAL EDIT ---
  const startEditing = (item: ItineraryItem) => {
      setEditingItemId(item.id);
      setEditValue(item.activity);
  };

  const saveEdit = (dayIndex: number) => {
      if (!editingItemId) return;
      const newItinerary = [...currentItinerary];
      const itemIndex = newItinerary[dayIndex].items.findIndex(i => i.id === editingItemId);
      if (itemIndex > -1) {
          newItinerary[dayIndex].items[itemIndex].activity = editValue;
          setCurrentItinerary(newItinerary);
      }
      setEditingItemId(null);
  };

  const deleteItem = (dayIndex: number, itemId: string) => {
      if(!confirm("Remove this item from the itinerary?")) return;
      const newItinerary = [...currentItinerary];
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter(i => i.id !== itemId);
      setCurrentItinerary(newItinerary);
  };

  const exportToPDF = () => {
    alert("PDF Download Started (Mock)");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-lg shadow-2xl transition-all duration-300 ${isMinimized ? "w-96 h-16" : "w-[95%] h-[95%] sm:w-[90%] sm:h-[90%] lg:w-[80%] lg:h-[90%]"} max-w-6xl max-h-screen overflow-hidden flex flex-col`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full"><Bot className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">AI Itinerary Planner</h2>
                <p className="text-red-100 text-sm">Interactive AI Agent</p>
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

        {/* Content */}
        {!isMinimized && (
          <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col">
            
            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <Badge variant={revisionCount >= MAX_REVISIONS ? "destructive" : "secondary"}>
                        Revisions: {revisionCount}/{MAX_REVISIONS}
                    </Badge>
                    {history.length > 0 && (
                        <Button variant="outline" size="sm" onClick={handleRevert} className="text-gray-600 h-8">
                            <RotateCcw className="w-3 h-3 mr-2" /> Undo
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => generateItinerary(true)} 
                        disabled={revisionCount >= MAX_REVISIONS || isGenerating}
                        className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                        {isGenerating ? "Thinking..." : (
                            <>
                                <RefreshCw className="w-3 h-3 mr-2" /> 
                                {weatherWarnings.length > 0 ? "Optimize for Weather" : "Revise Itinerary"}
                            </>
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF} className="h-8">
                        <Download className="w-3 h-3 mr-2" /> PDF
                    </Button>
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Weather Alert Block */}
                {weatherWarnings.length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
                    <div className="flex items-start space-x-3">
                      <CloudRain className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-800">Weather Optimization Available</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Some locations have rain forecast. Click <b>"Optimize for Weather"</b> to rearrange indoor activities.
                        </p>
                        <ul className="text-xs text-blue-600 mt-2 list-disc pl-4">
                            {weatherWarnings.map((w,i) => <li key={i}>{w}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Itinerary Cards */}
                {currentItinerary.map((day, dayIndex) => (
                  <Card key={day.day} className="border-gray-200 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b py-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-red-600"/>
                                <span className="font-bold text-gray-800">{day.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm text-gray-500">{day.weather.temp}</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            {day.items.map((item) => (
                                <div key={item.id} className="flex p-4 hover:bg-gray-50 transition-colors group">
                                    {/* Time Column */}
                                    <div className="flex flex-col items-center mr-4 w-16 pt-1">
                                        <span className="text-sm font-bold text-gray-900">{item.time}</span>
                                        <div className="h-full w-0.5 bg-gray-200 mt-2 group-last:hidden"></div>
                                    </div>

                                    {/* Content Column */}
                                    <div className="flex-1 pb-2">
                                        <div className="flex justify-between items-start">
                                            <div className="w-full">
                                                {/* Edit Mode Check */}
                                                {editingItemId === item.id ? (
                                                    <div className="flex gap-2 mb-2">
                                                        <Input 
                                                            value={editValue} 
                                                            onChange={(e) => setEditValue(e.target.value)} 
                                                            className="h-8"
                                                        />
                                                        <Button size="sm" onClick={() => saveEdit(dayIndex)} className="h-8 bg-green-600">Save</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8">Cancel</Button>
                                                    </div>
                                                ) : (
                                                    <h5 className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                                                        {item.activity}
                                                        {/* Activity Type Icon */}
                                                        {item.type === 'meal' && <Utensils className="w-3 h-3 text-gray-400"/>}
                                                        {item.type === 'travel' && <Car className="w-3 h-3 text-gray-400"/>}
                                                    </h5>
                                                )}
                                                
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mb-1">
                                                    <Clock className="w-3 h-3"/> {item.duration}
                                                    <span className="text-gray-300">|</span>
                                                    <MapPin className="w-3 h-3"/> {item.location}
                                                </div>
                                                {item.notes && (
                                                    <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded mt-1">
                                                        {item.notes}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons (Hover only) */}
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600" onClick={() => startEditing(item)}>
                                                    <Pencil className="w-3 h-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-600" onClick={() => deleteItem(dayIndex, item.id)}>
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {/* Add Item Button */}
                            <div className="p-3 text-center border-t border-dashed">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600 w-full border-dashed border">
                                    <Plus className="w-4 h-4 mr-2" /> Add Activity Manually
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}