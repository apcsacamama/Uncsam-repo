import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient"; 
import {
  MapPin, 
  X, Bot, Calendar, Clock, Download, CloudRain, Sun, Cloud,
  Camera, Utensils, Sparkles, Car, RotateCcw, Send, User, Pencil, Trash2, Loader2,
  Navigation
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

export default function ItineraryChatbot({
  selectedDestinations,
  customItinerary,
  isVisible,
  onClose,
  travelDate,
  travelers,
}: ItineraryChatbotProps) {
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [currentItinerary, setCurrentItinerary] = useState<DayItinerary[]>([]);
  const [history, setHistory] = useState<DayItinerary[][]>([]); 
  
  const totalDays = customItinerary && customItinerary.length > 0 ? customItinerary.length : 1;
  const MAX_AI_REVISIONS = totalDays * 5; 
  const [revisionCount, setRevisionCount] = useState(0);

  // --- TRIP SETTINGS ---
  const [hasSetup, setHasSetup] = useState(false);
  const [tourSettings, setTourSettings] = useState({
    pickupAddress: "",
    startTime: "09:00"
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && !hasSetup && currentItinerary.length === 0) {
      setChatMessages([]);
    }
  }, [isVisible]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchRealWeather = async (location: string, date: string) => {
    try {
        const { data, error } = await supabase.functions.invoke('itinerary-agent', {
            body: { action: 'fetch-weather', payload: { location, date } }
        });
        if (error) throw error;
        
        return {
            condition: data.condition || "Unknown",
            temp: data.temp || "--",
            summary: data.description || "No data"
        };
    } catch (err) {
        console.error("Weather fetch failed:", err);
        return { condition: "Sunny", temp: "24°C", summary: "Forecast unavailable" };
    }
  };

  const generateItinerary = async (isRevision: boolean = false, customInstruction: string = "") => {
    setIsGenerating(true);
    
    if (isRevision && customInstruction) {
        setChatMessages(prev => [...prev, { role: 'user', text: customInstruction, timestamp: new Date() }]);
    }

    if (currentItinerary.length > 0 && isRevision) setHistory(prev => [...prev, currentItinerary]);

    try {
        const destinationsList = customItinerary && customItinerary.length > 0 
            ? customItinerary.map((d: any) => d.location) 
            : selectedDestinations;

        const { data: rawAiData, error } = await supabase.functions.invoke('itinerary-agent', {
            body: { 
                action: isRevision ? 'chat-revision' : 'generate-itinerary',
                payload: {
                    destinations: destinationsList,
                    days: totalDays,
                    userPrompt: customInstruction,
                    currentItinerary: isRevision ? currentItinerary : null,
                    pickupAddress: tourSettings.pickupAddress,
                    startTime: tourSettings.startTime,
                    startDate: travelDate || "2026-02-17" 
                }
            }
        });

        if (error) {
            const details = await error.context?.json();
            throw new Error(details?.error || "Connection Error");
        }

        let aiData = rawAiData;
        if (typeof rawAiData === 'string') {
            // --- SAFETY PARSER: Prevents crashing if JSON is bad ---
            try {
                const cleanJson = rawAiData.replace(/```json/g, "").replace(/```/g, "").trim();
                aiData = JSON.parse(cleanJson);
            } catch (parseError) {
                // If parsing fails, assume it's a plain text error/message from AI
                aiData = { type: 'chat', message: rawAiData };
            }
        }

        // --- HANDLE FREE CHAT (No Revision Cost) ---
        // Using optional chaining (?.) prevents crash if aiData is null/undefined
        if (aiData?.type === 'chat') {
            setChatMessages(prev => [...prev, { 
                role: 'ai', 
                text: aiData.message || "I couldn't process that request. Please try again.", 
                timestamp: new Date() 
            }]);
            setIsGenerating(false);
            setPrompt("");
            return; 
        }

        // --- HANDLE FULL ITINERARY ---
        const safeArray = Array.isArray(aiData) ? aiData : [aiData];

        const enrichedItinerary = await Promise.all(safeArray.map(async (day: DayItinerary) => {
            const mainLocation = day.items?.find(i => i.location && i.location.length > 2)?.location || "Tokyo";
            const realWeather = await fetchRealWeather(mainLocation, day.date);
            return { ...day, weather: realWeather };
        }));

        setCurrentItinerary(enrichedItinerary);
        
        if (isRevision) setRevisionCount(prev => prev + 1);
        
        const left = MAX_AI_REVISIONS - (isRevision ? revisionCount + 1 : revisionCount);
        const aiResponseText = isRevision 
            ? `Itinerary updated! ${left} Revisions left.` 
            : `Plan ready for ${travelDate}. Driver is included!`;
        
        setChatMessages(prev => [...prev, { role: 'ai', text: aiResponseText, timestamp: new Date() }]);

    } catch (err: any) {
        console.error("AI Generation Error:", err);
        // --- ERROR DISPLAY: Show error in chat instead of closing modal ---
        setChatMessages(prev => [...prev, { 
            role: 'ai', 
            text: `System Error: ${err.message}. Please try asking differently.`, 
            timestamp: new Date() 
        }]);
    } finally {
        setIsGenerating(false);
        setPrompt(""); 
    }
  };

  const handleManualEditSave = (dayIndex: number) => {
      if (!editingItemId) return;
      const newItinerary = [...currentItinerary];
      const itemIndex = newItinerary[dayIndex].items.findIndex(i => i.id === editingItemId);
      if (itemIndex > -1) {
          newItinerary[dayIndex].items[itemIndex].activity = editValue;
          setCurrentItinerary(newItinerary);
          setChatMessages(prev => [...prev, { role: 'ai', text: "Edit saved.", timestamp: new Date() }]);
      }
      setEditingItemId(null);
  };

  const handleManualDelete = (dayIndex: number, itemId: string) => {
      if(!confirm("Remove item?")) return;
      const newItinerary = [...currentItinerary];
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter(i => i.id !== itemId);
      setCurrentItinerary(newItinerary);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Item removed.", timestamp: new Date() }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    setCurrentItinerary(history[history.length - 1]);
    setHistory(prev => prev.slice(0, -1));
    setChatMessages(prev => [...prev, { role: 'ai', text: "Undo success.", timestamp: new Date() }]);
  };

  const handleSubmitPrompt = (e: React.FormEvent) => {
      e.preventDefault();
      if (prompt.trim()) generateItinerary(true, prompt);
  };

  const handleStartPlanning = () => {
    setHasSetup(true);
    setChatMessages([{
        role: 'ai',
        text: `Creating your private driver tour for ${travelDate}...`,
        timestamp: new Date()
    }]);
    generateItinerary(false);
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
    const c = condition.toLowerCase();
    if (c.includes("rain")) return <CloudRain className="w-5 h-5 text-blue-200" />;
    if (c.includes("cloud")) return <Cloud className="w-5 h-5 text-gray-200" />;
    return <Sun className="w-5 h-5 text-yellow-300" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 flex-shrink-0 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm"><Bot className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">AI Itinerary Planner (Gemini 2.5)</h2>
              <div className="flex items-center gap-3 text-xs text-blue-100">
                 <Badge variant="outline" className="text-white border-white/40 bg-white/10 font-normal">
                    {totalDays} Day Trip
                 </Badge>
                 {hasSetup && (
                     <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        {MAX_AI_REVISIONS - revisionCount} Revisions
                     </span>
                 )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
            
            {/* TRIP SETUP */}
            {!hasSetup && (
                <div className="absolute inset-0 z-20 bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-6 border border-blue-100">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Navigation className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Tour Setup</h3>
                            <p className="text-gray-500 mt-2">Where should our private driver pick you up for this {travelDate} trip?</p>
                        </div>
                        
                        <div className="space-y-4 text-left">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Hotel / Pickup Address</label>
                                <Input 
                                    placeholder="Ex: Shinjuku Granbell Hotel" 
                                    className="mt-1 h-12 text-lg"
                                    value={tourSettings.pickupAddress}
                                    onChange={(e) => setTourSettings({...tourSettings, pickupAddress: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Start Time</label>
                                <Input 
                                    type="time" 
                                    className="mt-1 h-12 text-lg"
                                    value={tourSettings.startTime}
                                    onChange={(e) => setTourSettings({...tourSettings, startTime: e.target.value})}
                                />
                            </div>
                        </div>

                        <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-lg" onClick={handleStartPlanning}>
                            Start My Tour
                        </Button>
                    </div>
                </div>
            )}

            {/* ITINERARY VIEW */}
            <div className="flex-1 md:w-[65%] bg-gray-50/50 overflow-y-auto p-4 md:p-6 space-y-6 border-r border-gray-200">
                {currentItinerary.map((day, dayIndex) => (
                    <div key={day.day} className="space-y-4">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white shadow-md">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-base flex items-center gap-2">
                                        {getWeatherIcon(day.weather.condition)}
                                        {day.date}
                                    </h3>
                                    <p className="text-blue-50 text-xs mt-1 capitalize">{day.weather.summary}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold">{day.weather.temp}</span>
                                </div>
                            </div>
                        </div>

                        <Card className="border-none shadow-sm ring-1 ring-gray-200/50">
                            <CardContent className="p-0">
                                <div className="relative p-4">
                                    {day.items?.map((item) => (
                                        <div key={item.id} className="flex gap-4 py-3 border-b last:border-0 group relative">
                                            <div className="text-xs text-gray-400 w-12 pt-1">{item.time}</div>
                                            <div className="flex-1">
                                                {editingItemId === item.id ? (
                                                    <div className="flex gap-2">
                                                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" />
                                                        <Button size="sm" onClick={() => handleManualEditSave(dayIndex)} className="h-8 bg-green-600">Save</Button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="text-sm font-semibold text-gray-800">{item.activity}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <MapPin className="w-3 h-3"/> {item.location} • {item.duration}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="absolute right-0 top-3 opacity-0 group-hover:opacity-100 flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItemId(item.id); setEditValue(item.activity); }}>
                                                    <Pencil className="w-3 h-3 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleManualDelete(dayIndex, item.id)}>
                                                    <Trash2 className="w-3 h-3 text-red-600" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>

            {/* CHAT VIEW */}
            <div className="md:w-[35%] bg-white flex flex-col border-t md:border-t-0 shadow-xl">
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                    {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                {msg.role === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                            </div>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {format(msg.timestamp, 'h:mm a')}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isGenerating && (
                        <div className="flex gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center"><Bot className="w-4 h-4" /></div>
                            <div className="bg-gray-50 rounded-2xl px-4 py-2 text-xs text-gray-400">Thinking...</div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50/50">
                    <form onSubmit={handleSubmitPrompt} className="relative">
                        <Input 
                            value={prompt} 
                            onChange={(e) => setPrompt(e.target.value)} 
                            placeholder={hasSetup ? "Ask tips or change the plan..." : "Setup first..."}
                            className="pr-12 py-6 bg-white rounded-full"
                            disabled={isGenerating || !hasSetup}
                        />
                        <Button type="submit" size="icon" disabled={isGenerating || !prompt.trim() || !hasSetup} className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-blue-600">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                    <p className="text-[10px] text-center text-gray-400 mt-2">Questions are free. Changes cost a revision.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}