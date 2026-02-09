import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import {
  MapPin, X, Bot, Calendar, Clock, Download, CloudRain, Sun,
  Camera, Utensils, Sparkles, Car, RotateCcw, Send, User, Pencil, Trash2
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

interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

interface ItineraryChatbotProps {
  selectedDestinations: string[]; 
  customItinerary?: any[];
  isVisible: boolean;
  onClose: () => void;
  travelDate: string;
  travelers: number;
}

// --- HELPER ---
const addTime = (startTime: string, minutesToAdd: number): string => {
  const [hours, mins] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  date.setMinutes(date.getMinutes() + minutesToAdd);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export default function ItineraryChatbot({
  selectedDestinations,
  customItinerary,
  isVisible,
  onClose,
  travelDate,
  travelers,
}: ItineraryChatbotProps) {
  
  // --- STATE ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [currentItinerary, setCurrentItinerary] = useState<DayItinerary[]>([]);
  const [history, setHistory] = useState<DayItinerary[][]>([]); 
  
  // --- REVISION LOGIC ---
  const totalDays = customItinerary && customItinerary.length > 0 ? customItinerary.length : 1;
  const MAX_AI_REVISIONS = totalDays * 5; 
  const [revisionCount, setRevisionCount] = useState(0);

  // Manual Edit State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Load
  useEffect(() => {
    if (isVisible && currentItinerary.length === 0) {
      setChatMessages([{
        role: 'ai',
        text: `Hello! I've prepared a ${totalDays}-day itinerary. You have ${MAX_AI_REVISIONS} AI revisions available. Note: Manual edits using the pencil icon are unlimited and free!`,
        timestamp: new Date()
      }]);
      generateItinerary(false); 
    }
  }, [isVisible]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // --- 1. AI GENERATOR (COSTS REVISIONS) ---
  const generateItinerary = async (isRevision: boolean = false, customInstruction: string = "") => {
    if (isRevision && revisionCount >= MAX_AI_REVISIONS) return;

    setIsGenerating(true);
    
    if (isRevision && customInstruction) {
        setChatMessages(prev => [...prev, { role: 'user', text: customInstruction, timestamp: new Date() }]);
    }

    if (currentItinerary.length > 0) setHistory(prev => [...prev, currentItinerary]);

    // Data Prep
    const daysData = (customItinerary && customItinerary.length > 0) 
        ? customItinerary 
        : [{ destinations: selectedDestinations, date: travelDate }];

    const generatedDays: DayItinerary[] = [];

    // Simulate AI Thinking
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Loop Days
    for (let i = 0; i < daysData.length; i++) {
        const dayData = daysData[i];
        const dayDestinations = dayData.destinations || [];
        
        let dateDisplay = dayData.date;
        try {
             if(dayData.date && !dayData.date.includes("|")) {
                 dateDisplay = format(new Date(dayData.date), "MMM dd");
             }
        } catch(e) {}

        const dayItems: ItineraryItem[] = [];
        let currentTime = "09:00"; 

        if (customInstruction.toLowerCase().includes("start earlier")) currentTime = "08:00";
        if (customInstruction.toLowerCase().includes("start later")) currentTime = "10:00";

        // Start
        dayItems.push({
            id: `day${i}-start`,
            time: currentTime,
            activity: "Hotel Pick-up",
            location: "Your Stay",
            duration: "30 mins",
            type: "travel"
        });
        currentTime = addTime(currentTime, 30);

        // Destinations
        const reorderedDestinations = (isRevision && customInstruction.includes("reverse")) 
            ? [...dayDestinations].reverse() 
            : dayDestinations;

        reorderedDestinations.forEach((dest: string, idx: number) => {
            dayItems.push({
                id: `day${i}-travel-${idx}`,
                time: currentTime,
                activity: `Travel to ${dest}`,
                location: "Private Van",
                duration: "30 mins",
                type: "travel"
            });
            currentTime = addTime(currentTime, 30);

            dayItems.push({
                id: `day${i}-visit-${idx}`,
                time: currentTime,
                activity: `Explore ${dest}`,
                location: dest,
                duration: "1h 30m",
                type: "sightseeing"
            });
            currentTime = addTime(currentTime, 90);

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

        // End
        dayItems.push({
            id: `day${i}-end`,
            time: currentTime,
            activity: "Drop-off at Hotel",
            location: "Your Stay",
            duration: "30 mins",
            type: "travel"
        });

        generatedDays.push({
            day: i + 1,
            date: dateDisplay || `Day ${i + 1}`,
            items: dayItems,
            weather: { condition: "Sunny", temp: "24°C", summary: "Perfect for sightseeing" }
        });
    }

    setCurrentItinerary(generatedDays);
    
    // Increment Count ONLY if AI Action
    if (isRevision) {
        setRevisionCount(prev => prev + 1);
        const left = MAX_AI_REVISIONS - (revisionCount + 1);
        setChatMessages(prev => [...prev, { role: 'ai', text: `Itinerary updated! You have ${left} AI revisions remaining.`, timestamp: new Date() }]);
    } else {
        setChatMessages(prev => [...prev, { role: 'ai', text: "Here is your plan. Manual edits are free!", timestamp: new Date() }]);
    }

    setIsGenerating(false);
    setPrompt(""); 
  };

  // --- 2. MANUAL ACTIONS (FREE) ---
  const handleManualEditSave = (dayIndex: number) => {
      if (!editingItemId) return;
      
      const newItinerary = [...currentItinerary];
      const itemIndex = newItinerary[dayIndex].items.findIndex(i => i.id === editingItemId);
      
      if (itemIndex > -1) {
          // Update item directly without touching revisionCount
          newItinerary[dayIndex].items[itemIndex].activity = editValue;
          setCurrentItinerary(newItinerary);
          setChatMessages(prev => [...prev, { role: 'ai', text: "Manual edit saved. No revision points used.", timestamp: new Date() }]);
      }
      setEditingItemId(null);
  };

  const handleManualDelete = (dayIndex: number, itemId: string) => {
      if(!confirm("Remove this item?")) return;
      
      const newItinerary = [...currentItinerary];
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter(i => i.id !== itemId);
      setCurrentItinerary(newItinerary);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Item removed manually. No revision points used.", timestamp: new Date() }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setCurrentItinerary(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setChatMessages(prev => [...prev, { role: 'ai', text: "Undo successful.", timestamp: new Date() }]);
  };

  const handleSubmitPrompt = (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) generateItinerary(true, prompt);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "travel": return <Car className="w-3 h-3 text-blue-600" />;
      case "meal": return <Utensils className="w-3 h-3 text-green-600" />;
      case "sightseeing": return <Camera className="w-3 h-3 text-purple-600" />;
      default: return <Clock className="w-3 h-3 text-gray-600" />;
    }
  };

  const getWeatherIcon = (condition: string) => {
    return condition.toLowerCase().includes("rain") ? <CloudRain className="w-5 h-5 text-blue-200" /> : <Sun className="w-5 h-5 text-yellow-300" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* --- HEADER --- */}
        <div className="bg-gradient-to-r from-red-700 to-red-600 text-white p-4 flex-shrink-0 flex justify-between items-center shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Bot className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Itinerary Planner</h2>
              <div className="flex items-center gap-3 text-xs text-red-100">
                 <Badge variant="outline" className="text-white border-white/40 bg-white/10 font-normal">
                    {totalDays} Day Trip
                 </Badge>
                 <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300" />
                    {MAX_AI_REVISIONS - revisionCount} AI Revisions Left
                 </span>
                 <span className="bg-green-500/20 px-2 py-0.5 rounded-full border border-green-400/30 text-green-100">
                    Manual Edits: Free
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {history.length > 0 && (
                 <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={handleUndo}>
                     <RotateCcw className="w-4 h-4 mr-2" /> Undo
                 </Button>
             )}
             <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
               <X className="w-6 h-6" />
             </Button>
          </div>
        </div>

        {/* --- MAIN BODY --- */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* LEFT: ITINERARY VIEW */}
          <div className="flex-1 md:w-[65%] bg-gray-50/50 overflow-y-auto p-4 md:p-6 space-y-6 border-r border-gray-200">
              {currentItinerary.map((day, dayIndex) => (
                  <div key={day.day} className="space-y-4">
                      
                      {/* --- WEATHER FORECAST PANEL (Restored) --- */}
                      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg p-4 text-white shadow-md relative overflow-hidden">
                          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                          <div className="flex justify-between items-center relative z-10">
                              <div>
                                  <h3 className="font-bold text-base flex items-center gap-2">
                                      {getWeatherIcon(day.weather.condition)}
                                      {day.date} Forecast
                                  </h3>
                                  <p className="text-blue-100 text-xs mt-1">{day.weather.summary}</p>
                              </div>
                              <div className="text-right">
                                  <span className="text-2xl font-bold">{day.weather.temp}</span>
                                  <p className="text-[10px] text-blue-100 uppercase font-semibold tracking-wider">{day.weather.condition}</p>
                              </div>
                          </div>
                      </div>

                      {/* --- TIMELINE CARD --- */}
                      <Card className="border-none shadow-sm ring-1 ring-gray-200/50">
                          <CardHeader className="bg-white border-b py-3 px-5">
                              <div className="flex items-center gap-2">
                                  <div className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded text-xs">DAY {day.day}</div>
                                  <span className="font-bold text-gray-700 text-sm">Itinerary Timeline</span>
                              </div>
                          </CardHeader>
                          <CardContent className="p-0">
                              <div className="relative">
                                  <div className="absolute left-[3.25rem] top-4 bottom-4 w-0.5 bg-gray-100"></div>
                                  <div className="space-y-0">
                                      {day.items.map((item) => (
                                          <div key={item.id} className="flex group hover:bg-gray-50 transition-colors py-3 px-4 relative">
                                              <div className="w-10 text-right text-xs font-medium text-gray-400 pt-1 mr-4 flex-shrink-0">{item.time}</div>
                                              <div className="relative z-10 mr-4">
                                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border bg-white ${
                                                      item.type === 'travel' ? 'border-blue-200 text-blue-500' :
                                                      item.type === 'meal' ? 'border-green-200 text-green-500' :
                                                      'border-purple-200 text-purple-500'
                                                  }`}>
                                                      {getActivityIcon(item.type)}
                                                  </div>
                                              </div>
                                              <div className="flex-1 pt-0.5">
                                                  {/* EDIT MODE */}
                                                  {editingItemId === item.id ? (
                                                      <div className="flex gap-2 mb-2 w-full">
                                                          <Input 
                                                              value={editValue} 
                                                              onChange={(e) => setEditValue(e.target.value)} 
                                                              className="h-8 text-sm bg-white"
                                                              autoFocus
                                                          />
                                                          <Button size="sm" onClick={() => handleManualEditSave(dayIndex)} className="h-8 bg-green-600">Save</Button>
                                                          <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8">Cancel</Button>
                                                      </div>
                                                  ) : (
                                                      <>
                                                          <h4 className="text-sm font-semibold text-gray-800 leading-tight">{item.activity}</h4>
                                                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.duration}</span>
                                                              {item.location !== "Private Van" && <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {item.location}</span>}
                                                          </div>
                                                      </>
                                                  )}
                                              </div>

                                              {/* MANUAL CONTROLS */}
                                              {editingItemId !== item.id && (
                                                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border rounded flex">
                                                      <button onClick={() => { setEditingItemId(item.id); setEditValue(item.activity); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-l" title="Edit (Free)">
                                                          <Pencil className="w-3 h-3" />
                                                      </button>
                                                      <div className="w-px bg-gray-200"></div>
                                                      <button onClick={() => handleManualDelete(dayIndex, item.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded-r" title="Delete (Free)">
                                                          <Trash2 className="w-3 h-3" />
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  </div>
              ))}
              <div className="h-12"></div>
          </div>

          {/* RIGHT: CHAT */}
          <div className="md:w-[35%] bg-white flex flex-col h-[40vh] md:h-auto border-t md:border-t-0 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                              {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              msg.role === 'user' 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-gray-100 text-gray-800 rounded-bl-none'
                          }`}>
                              <p>{msg.text}</p>
                              <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {format(msg.timestamp, 'h:mm a')}
                              </p>
                          </div>
                      </div>
                  ))}
                  {isGenerating && (
                      <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                          <div className="bg-gray-50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                          </div>
                      </div>
                  )}
              </div>

              <div className="p-4 border-t bg-gray-50/50">
                  <form onSubmit={handleSubmitPrompt} className="relative">
                      <Input 
                          value={prompt} 
                          onChange={(e) => setPrompt(e.target.value)} 
                          placeholder={revisionCount >= MAX_AI_REVISIONS ? "Max AI revisions reached. Use manual tools." : "Ex: Swap Day 1 lunch..."}
                          className="pr-12 py-6 bg-white border-gray-200 focus-visible:ring-red-500 rounded-full shadow-sm"
                          disabled={isGenerating || revisionCount >= MAX_AI_REVISIONS}
                      />
                      <Button 
                          type="submit" 
                          size="icon" 
                          disabled={isGenerating || !prompt.trim() || revisionCount >= MAX_AI_REVISIONS} 
                          className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-red-600 hover:bg-red-700 text-white"
                      >
                          {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                  </form>
                  <p className="text-[10px] text-center text-gray-400 mt-2">
                      <strong>Note:</strong> Chat requests use AI Revisions. Manual edits (pencil/trash) are free.
                  </p>
              </div>
          </div>

        </div>
      </div>
    </div>
  );
}