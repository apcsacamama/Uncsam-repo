import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import { supabase } from "../lib/supabaseClient"; 
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MapPin, X, Bot, CloudRain, Sun, Cloud, Send, User, Pencil, Trash2, 
  Loader2, RotateCcw, Sparkles, Download 
} from "lucide-react";

export default function ItineraryChatbot({ selectedDestinations, customItinerary, isVisible, onClose, travelDate }: any) {
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [currentItinerary, setCurrentItinerary] = useState<any[]>([]);
  const [history, setHistory] = useState<any[][]>([]); 
  
  const totalDays = customItinerary && customItinerary.length > 0 ? customItinerary.length : 1;
  const MAX_AI_REVISIONS = 5; 
  const [revisionCount, setRevisionCount] = useState(0);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-Start
  useEffect(() => {
    if (isVisible && currentItinerary.length === 0) {
      setChatMessages([{ role: 'ai', text: "Building your plan...", timestamp: new Date() }]);
      generateItinerary(false); 
    }
  }, [isVisible]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const fetchRealWeather = async (location: string, date: string) => {
    try {
        const { data } = await supabase.functions.invoke('itinerary-agent', { body: { action: 'fetch-weather', payload: { location, date } } });
        return { condition: data.condition || "Clear", temp: data.temp || "20°C", summary: data.summary || "Fair" };
    } catch { return { condition: "Clear", temp: "20°C", summary: "Fair" }; }
  };

  const generateItinerary = async (isRevision: boolean = false, customInstruction: string = "") => {
    if (isRevision && revisionCount >= MAX_AI_REVISIONS) return;
    setIsGenerating(true);
    
    if (isRevision && customInstruction) setChatMessages(prev => [...prev, { role: 'user', text: customInstruction, timestamp: new Date() }]);
    if (currentItinerary.length > 0) setHistory(prev => [...prev, currentItinerary]);

    try {
        const destinationsList = customItinerary && customItinerary.length > 0 ? customItinerary.map((d: any) => d.location) : selectedDestinations;

        // 1. CALL BACKEND
        const { data: rawAiData, error } = await supabase.functions.invoke('itinerary-agent', {
            body: { 
                action: isRevision ? 'chat-revision' : 'generate-itinerary',
                payload: { destinations: destinationsList, days: totalDays, userPrompt: customInstruction, currentItinerary: isRevision ? currentItinerary : null, startDate: travelDate }
            }
        });

        if (error) throw new Error("Connection Failed");

        // 2. PARSE DATA
        let aiData = typeof rawAiData === 'string' ? JSON.parse(rawAiData.replace(/```json/gi, "").replace(/```/gi, "").trim()) : rawAiData;
        let safeArray = Array.isArray(aiData) ? aiData : [aiData];

        // 3. *** AUTO-FIX: FLAT LIST vs NESTED LIST ***
        // If the AI returns a list of items instead of a Day object, we WRAP IT.
        // This prevents the "5 Blue Headers" bug.
        if (safeArray.length > 0 && !safeArray[0].items && safeArray[0].activity) {
            safeArray = [{
                day: 1,
                date: travelDate || "2026-02-18",
                items: safeArray,
                weather: { condition: "Loading", temp: "...", summary: "Loading..." }
            }];
        }

        // 4. RENDER IMMEDIATELY (No waiting for weather)
        const instantView = safeArray.map((day: any) => ({
            ...day,
            weather: day.weather || { condition: "Loading", temp: "...", summary: "Checking forecast..." }
        }));
        setCurrentItinerary(instantView);
        setIsGenerating(false); // Stop spinner!

        // 5. FETCH WEATHER IN BACKGROUND
        const finalView = await Promise.all(safeArray.map(async (day: any) => {
            const city = day.items?.[0]?.location || "Tokyo";
            const weather = await fetchRealWeather(city, day.date);
            return { ...day, weather };
        }));

        setCurrentItinerary(finalView);
        
        if (isRevision) setRevisionCount(prev => prev + 1);
        setChatMessages(prev => [...prev, { role: 'ai', text: isRevision ? "Updated!" : "Here is your plan!", timestamp: new Date() }]);

    } catch (err: any) {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}`, timestamp: new Date() }]);
    } finally { setIsGenerating(false); setPrompt(""); }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(37, 99, 235); doc.text("Unclesam Tours Itinerary", 14, 22);
    currentItinerary.forEach((day, index) => {
        const startY = index === 0 ? 45 : (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14); doc.setTextColor(0); doc.text(`Day ${day.day} - ${day.date}`, 14, startY);
        autoTable(doc, {
            startY: startY + 5, head: [['Time', 'Activity', 'Location']],
            body: day.items?.map((i: any) => [i.time, i.activity, i.location]) || [],
            theme: 'striped', headStyles: { fillColor: [37, 99, 235] }
        });
    });
    doc.save(`Itinerary.pdf`);
  };

  // KEEPING MANUAL EDIT FUNCTIONS AS IS
  const handleManualEditSave = (dayIndex: number) => {
      if (!editingItemId) return;
      const newItinerary = [...currentItinerary];
      const itemIndex = newItinerary[dayIndex].items.findIndex((i: any) => i.id === editingItemId);
      if (itemIndex > -1) { newItinerary[dayIndex].items[itemIndex].activity = editValue; setCurrentItinerary(newItinerary); }
      setEditingItemId(null);
  };

  const handleManualDelete = (dayIndex: number, itemId: string) => {
      if(!confirm("Remove this item?")) return;
      const newItinerary = [...currentItinerary];
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter((i: any) => i.id !== itemId);
      setCurrentItinerary(newItinerary);
  };

  const handleUndo = () => { if (history.length > 0) { setCurrentItinerary(history[history.length - 1]); setHistory(prev => prev.slice(0, -1)); } };
  const handleSubmitPrompt = (e: React.FormEvent) => { e.preventDefault(); if (prompt.trim()) generateItinerary(true, prompt); };
  
  const getWeatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain")) return <CloudRain className="w-5 h-5 text-blue-200" />;
    if (c.includes("cloud")) return <Cloud className="w-5 h-5 text-gray-200" />;
    return <Sun className="w-5 h-5 text-yellow-300" />;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><Bot className="w-6 h-6 text-white" /></div>
            <div>
              <h2 className="text-xl font-bold">AI Itinerary Planner (Gemini 2.5 Flash)</h2>
              <div className="flex items-center gap-3 text-xs text-blue-100">
                 <Badge variant="outline" className="text-white border-white/40">{totalDays} Day Trip</Badge>
                 <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-300" /> {MAX_AI_REVISIONS - revisionCount} Revisions Left
                 </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {currentItinerary.length > 0 && <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={generatePDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>}
             {history.length > 0 && <Button size="sm" variant="ghost" className="text-white" onClick={handleUndo}><RotateCcw className="w-4 h-4 mr-2" /> Undo</Button>}
             <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full"><X className="w-6 h-6" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* ITINERARY LIST */}
          <div className="flex-1 md:w-[65%] bg-gray-50/50 overflow-y-auto p-4 md:p-6 space-y-6 border-r border-gray-200">
              {currentItinerary.length === 0 && !isGenerating && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                    <Loader2 className="w-12 h-12 animate-spin mb-4" />
                    <p>Building your plan...</p>
                </div>
              )}
              {currentItinerary.map((day, idx) => (
                  <div key={idx} className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white flex justify-between items-center shadow-md">
                          <div>
                              <h3 className="font-bold flex items-center gap-2">
                                  {getWeatherIcon(day.weather?.condition)} Day {day.day} - {day.date}
                              </h3>
                              <p className="text-blue-50 text-xs mt-1">{day.weather?.summary}</p>
                          </div>
                          <span className="text-2xl font-bold">{day.weather?.temp}</span>
                      </div>
                      <Card className="border-none shadow-sm ring-1 ring-gray-200/50">
                          <CardContent className="p-4 space-y-3">
                              {day.items && day.items.length > 0 ? (
                                  day.items.map((item: any, i: number) => (
                                      <div key={i} className="flex gap-4 py-3 border-b last:border-0">
                                          <div className="text-xs text-gray-400 w-12 pt-1">{item.time}</div>
                                          <div className="flex-1">
                                              {editingItemId === item.id ? (
                                                  <div className="flex gap-2"><Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-sm" /><Button size="sm" onClick={() => handleManualEditSave(idx)} className="h-8 bg-green-600">Save</Button></div>
                                              ) : (
                                                  <>
                                                      <div className="text-sm font-semibold text-gray-800">{item.activity}</div>
                                                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location}</div>
                                                  </>
                                              )}
                                          </div>
                                          <div className="absolute right-0 top-3 opacity-0 group-hover:opacity-100 flex gap-1">
                                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingItemId(item.id); setEditValue(item.activity); }}><Pencil className="w-3 h-3 text-blue-600" /></Button>
                                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleManualDelete(idx, item.id)}><Trash2 className="w-3 h-3 text-red-600" /></Button>
                                          </div>
                                      </div>
                                  ))
                              ) : (
                                  <div className="text-gray-400 italic text-center">No items.</div>
                              )}
                          </CardContent>
                      </Card>
                  </div>
              ))}
          </div>

          {/* CHAT */}
          <div className="md:w-[35%] bg-white flex flex-col border-t md:border-t-0 shadow-xl">
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{msg.text}</div>
                      </div>
                  ))}
                  {isGenerating && <div className="text-xs text-gray-400 animate-pulse px-4">Thinking...</div>}
              </div>
              <div className="p-4 border-t bg-gray-50/50">
                  <form onSubmit={handleSubmitPrompt} className="relative">
                      <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Modify plan..." className="pr-12 rounded-full" disabled={isGenerating} />
                      <Button type="submit" size="icon" disabled={isGenerating || !prompt.trim()} className="absolute right-1.5 top-1.5 h-9 w-9 rounded-full bg-blue-600"><Send className="w-4 h-4" /></Button>
                  </form>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}