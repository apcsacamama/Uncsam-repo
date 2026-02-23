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
  Loader2, RotateCcw, Sparkles, Download, Plus 
} from "lucide-react";

export default function ItineraryChatbot({ selectedDestinations, customItinerary, isVisible, onClose, travelDate }: any) {
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [currentItinerary, setCurrentItinerary] = useState<any[]>([]);
  const [history, setHistory] = useState<any[][]>([]); 
  
  // Enforce correct day count based on how many tours are in the cart
  const totalDays = customItinerary && customItinerary.length > 0 ? customItinerary.length : selectedDestinations?.length || 1;
  const MAX_AI_REVISIONS = 5; 
  const [revisionCount, setRevisionCount] = useState(0);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const [addingDayIdx, setAddingDayIdx] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ time: "12:00", activity: "", location: "" });

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && currentItinerary.length === 0) {
      setChatMessages([{ role: 'ai', text: `Hello! I'm mapping out your ${totalDays}-day private tour...`, timestamp: new Date() }]);
      generateItinerary(false); 
    }
  }, [isVisible]);

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
    setIsGenerating(true);
    
    if (isRevision && customInstruction) {
        setChatMessages(prev => [...prev, { role: 'user', text: customInstruction, timestamp: new Date() }]);
    }

    const previousPlan = JSON.parse(JSON.stringify(currentItinerary));

    try {
        // Extract the actual names of the tours booked
        const tourNamesList = customItinerary && customItinerary.length > 0 
            ? customItinerary.map((d: any) => d.title || d.name || d.location || "Custom Tour") 
            : selectedDestinations;

        const { data: rawAiData, error } = await supabase.functions.invoke('itinerary-agent', {
            body: { 
                action: isRevision ? 'chat-revision' : 'generate-itinerary',
                payload: { tourNames: tourNamesList, days: totalDays, userPrompt: customInstruction, currentItinerary: isRevision ? currentItinerary : null, startDate: travelDate }
            }
        });

        if (error) throw new Error("Connection Failed");

        let response = typeof rawAiData === 'string' ? JSON.parse(rawAiData.replace(/```json/gi, "").replace(/```/gi, "").trim()) : rawAiData;

        if (response.type === 'inquiry') {
            setChatMessages(prev => [...prev, { role: 'ai', text: response.message, timestamp: new Date() }]);
        } 
        else {
            if (isRevision && revisionCount >= MAX_AI_REVISIONS) {
                 setChatMessages(prev => [...prev, { role: 'ai', text: "Limit reached. I cannot update the plan further, but I can still answer questions!", timestamp: new Date() }]);
                 setIsGenerating(false);
                 return;
            }

            if (previousPlan.length > 0) setHistory(prev => [...prev, previousPlan]);

            let safeArray = Array.isArray(response.itinerary) ? response.itinerary : [response.itinerary];
            if (safeArray.length > 0 && !safeArray[0].items && safeArray[0].activity) {
                safeArray = [{ day: 1, tourName: tourNamesList[0], date: travelDate || "2026-02-18", items: safeArray }];
            }

            const instantView = safeArray.map((day: any) => ({
                ...day,
                items: day.items?.map((i: any, idx: number) => ({ ...i, id: i.id || `ai-item-${Date.now()}-${idx}` })),
                weather: day.weather || { condition: "Loading", temp: "...", summary: "..." }
            }));
            setCurrentItinerary(instantView);

            const finalView = await Promise.all(instantView.map(async (day: any) => {
                const city = day.items?.[0]?.location || "Tokyo";
                const weather = await fetchRealWeather(city, day.date);
                return { ...day, weather };
            }));
            setCurrentItinerary(finalView);

            if (isRevision) setRevisionCount(prev => prev + 1);
            
            const msg = response.message || (isRevision ? "Plan updated!" : "Here is your custom plan.");
            setChatMessages(prev => [...prev, { role: 'ai', text: msg, timestamp: new Date() }]);
        }

    } catch (err: any) {
        setChatMessages(prev => [...prev, { role: 'ai', text: `Error: ${err.message}`, timestamp: new Date() }]);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmitPrompt = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (prompt.trim()) {
          generateItinerary(true, prompt);
          setPrompt(""); 
      }
  };

  const handleManualEditSave = (dayIndex: number) => {
      if (!editingItemId) return;
      const newItinerary = JSON.parse(JSON.stringify(currentItinerary));
      const day = newItinerary[dayIndex];
      if (day && day.items) {
          const itemIndex = day.items.findIndex((i: any) => i.id === editingItemId);
          if (itemIndex > -1) { 
              day.items[itemIndex].activity = editValue; 
              setCurrentItinerary(newItinerary); 
              setChatMessages(prev => [...prev, { role: 'ai', text: "Changes saved.", timestamp: new Date() }]); 
          }
      }
      setEditingItemId(null);
  };

  const handleManualDelete = (dayIndex: number, itemId: string) => {
      if(!confirm("Are you sure you want to remove this activity?")) return;
      const newItinerary = JSON.parse(JSON.stringify(currentItinerary));
      newItinerary[dayIndex].items = newItinerary[dayIndex].items.filter((i: any) => i.id !== itemId);
      setCurrentItinerary(newItinerary);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Activity removed.", timestamp: new Date() }]);
  };

  const handleManualAddSave = (dayIndex: number) => {
      if (!newItem.activity.trim() || !newItem.location.trim()) return;
      
      const newItinerary = JSON.parse(JSON.stringify(currentItinerary));
      if (!newItinerary[dayIndex].items) newItinerary[dayIndex].items = [];
      
      newItinerary[dayIndex].items.push({
          id: `manual-item-${Date.now()}`,
          time: newItem.time,
          activity: newItem.activity,
          location: newItem.location
      });
      
      newItinerary[dayIndex].items.sort((a: any, b: any) => a.time.localeCompare(b.time));
      
      setCurrentItinerary(newItinerary);
      setAddingDayIdx(null);
      setNewItem({ time: "12:00", activity: "", location: "" });
      setChatMessages(prev => [...prev, { role: 'ai', text: "Manual activity added to your plan.", timestamp: new Date() }]);
  };

  const handleUndo = () => { if (history.length > 0) { setCurrentItinerary(history[history.length - 1]); setHistory(prev => prev.slice(0, -1)); } };
  
  // ==========================================
  // PROFESSIONAL PDF GENERATION
  // ==========================================
  const generatePDF = () => { 
    if (!currentItinerary || currentItinerary.length === 0) {
        alert("Please wait for the itinerary to generate before downloading.");
        return;
    }

    const doc = new jsPDF(); 
    
    doc.setFontSize(22);
    doc.setTextColor(29, 78, 216); 
    doc.text("Unclesam Tours", 14, 20);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("Your Custom Private Itinerary", 14, 28);
    
    if (travelDate) {
        doc.setFontSize(10);
        doc.text(`Starting Date: ${travelDate}`, 14, 34);
    }

    const tableData: any[] = [];
    
    currentItinerary.forEach((day: any) => {
        // PDF Output format: "Tokyo Highlights (Day 1)"
        const dayHeader = day.tourName ? `${day.tourName} (Day ${day.day})` : `Day ${day.day}`;
        const dayWeather = day.weather?.temp ? ` - ${day.weather.temp}, ${day.weather.summary}` : '';
        
        tableData.push([
            { 
                content: `${dayHeader}${dayWeather}`, 
                colSpan: 3, 
                styles: { fillColor: [240, 245, 255], fontStyle: 'bold', textColor: [29, 78, 216] } 
            }
        ]);
        
        if (day.items && day.items.length > 0) {
            day.items.forEach((item: any) => {
                if (item.activity && item.activity.length > 2) {
                    tableData.push([ item.time, item.activity, item.location ]);
                }
            });
        } else {
            tableData.push(["", "Free time or no activities scheduled.", ""]);
        }
    });

    autoTable(doc, {
        startY: 40,
        head: [['Time', 'Activity', 'Location']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, 
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 90 }, 2: { cellWidth: 'auto' } }
    });

    doc.save("Unclesam_Tours_Itinerary.pdf"); 
  };

  const getWeatherIcon = (c: string) => c?.includes("Rain") ? <CloudRain className="w-5 h-5 text-blue-300"/> : <Sun className="w-5 h-5 text-yellow-400"/>;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white p-4 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><Bot className="w-6 h-6 text-white" /></div>
            <div>
                <h2 className="text-xl font-bold">AI Itinerary Planner</h2>
                <div className="text-xs text-blue-100 flex gap-2">
                    <span className="bg-white/20 px-2 rounded-full flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-300"/> {MAX_AI_REVISIONS - revisionCount} Revisions Left</span>
                </div>
            </div>
          </div>
          <div className="flex gap-2">
             <Button size="sm" variant="ghost" onClick={generatePDF}><Download className="w-4 h-4 mr-2"/> PDF</Button>
             <Button size="icon" variant="ghost" onClick={onClose}><X className="w-6 h-6"/></Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 md:w-[65%] bg-gray-50/50 overflow-y-auto p-6 space-y-6 border-r">
              {currentItinerary.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Loader2 className="w-10 h-10 animate-spin mb-4"/>
                      <p>Building your private tour...</p>
                  </div>
              )}
              
              {currentItinerary.map((day, idx) => (
                  <div key={idx} className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white flex justify-between items-center shadow-md">
                          <div>
                              {/* UI Display Format: "Tokyo Highlights (Day 1)" */}
                              <h3 className="font-bold flex items-center gap-2">
                                  {getWeatherIcon(day.weather?.condition)} 
                                  {day.tourName ? `${day.tourName} (Day ${day.day})` : `Day ${day.day}`}
                              </h3>
                              <p className="text-xs">{day.weather?.summary}</p>
                          </div>
                          <span className="text-2xl font-bold">{day.weather?.temp}</span>
                      </div>
                      
                      <Card className="border-none shadow-sm"><CardContent className="p-0">
                          <div className="p-4">
                          
                          {day.items?.filter((i:any) => i.activity && i.activity.length > 2).map((item:any, i:number) => (
                              <div key={i} className="flex gap-4 py-3 border-b last:border-0 group relative items-start">
                                  <div className="text-xs text-gray-400 w-12 pt-1">{item.time}</div>
                                  <div className="flex-1">
                                      {editingItemId === item.id ? (
                                          <div className="flex flex-col gap-2 mr-16">
                                              <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8"/> 
                                              <div className="flex gap-2">
                                                  <Button size="sm" onClick={() => handleManualEditSave(idx)} className="bg-green-600 hover:bg-green-700 text-white">Save</Button>
                                                  <Button size="sm" variant="outline" onClick={() => setEditingItemId(null)}>Cancel</Button>
                                              </div>
                                          </div>
                                      ) : (
                                          <div className="pr-12">
                                              <div className="text-sm font-semibold">{item.activity}</div>
                                              <div className="text-xs text-gray-500 flex gap-1 mt-1"><MapPin className="w-3 h-3"/>{item.location}</div>
                                          </div>
                                      )}
                                  </div>
                                  
                                  {editingItemId !== item.id && (
                                      <div className="absolute right-0 top-3 opacity-0 group-hover:opacity-100 flex gap-1 bg-white pl-2">
                                          <Button variant="ghost" size="icon" onClick={() => { setEditingItemId(item.id); setEditValue(item.activity); }}><Pencil className="w-4 h-4 text-blue-600"/></Button>
                                          <Button variant="ghost" size="icon" onClick={() => handleManualDelete(idx, item.id)}><Trash2 className="w-4 h-4 text-red-600"/></Button>
                                      </div>
                                  )}
                              </div>
                          ))}

                          {addingDayIdx === idx ? (
                              <div className="mt-4 p-4 border rounded-lg bg-blue-50/50 space-y-3">
                                  <h4 className="text-sm font-semibold text-blue-800 mb-2">Add Manual Activity</h4>
                                  <div className="flex gap-3">
                                      <div className="w-24">
                                          <label className="text-xs text-gray-500">Time</label>
                                          <Input type="time" value={newItem.time} onChange={(e) => setNewItem({...newItem, time: e.target.value})} className="h-8 text-xs"/>
                                      </div>
                                      <div className="flex-1">
                                          <label className="text-xs text-gray-500">Activity</label>
                                          <Input placeholder="E.g., Dinner reservation" value={newItem.activity} onChange={(e) => setNewItem({...newItem, activity: e.target.value})} className="h-8 text-xs"/>
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-xs text-gray-500">Location</label>
                                      <Input placeholder="E.g., Shibuya, Tokyo" value={newItem.location} onChange={(e) => setNewItem({...newItem, location: e.target.value})} className="h-8 text-xs"/>
                                  </div>
                                  <div className="flex gap-2 pt-2">
                                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleManualAddSave(idx)}>Add to Itinerary</Button>
                                      <Button size="sm" variant="outline" onClick={() => setAddingDayIdx(null)}>Cancel</Button>
                                  </div>
                              </div>
                          ) : (
                              <Button variant="ghost" size="sm" className="w-full mt-3 text-blue-600 border border-dashed border-blue-200 hover:bg-blue-50" onClick={() => setAddingDayIdx(idx)}>
                                  <Plus className="w-4 h-4 mr-2" /> Add Activity Manually
                              </Button>
                          )}
                          
                          </div>
                      </CardContent></Card>
                  </div>
              ))}
          </div>
          
          <div className="md:w-[35%] bg-white flex flex-col shadow-xl border-l">
              <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{msg.text}</div>
                      </div>
                  ))}
                  {isGenerating && <div className="text-xs text-gray-400 animate-pulse px-4">Thinking...</div>}
              </div>
              <div className="p-4 border-t bg-gray-50">
                  <form onSubmit={handleSubmitPrompt} className="relative">
                      <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask a question or modify plan..." className="pr-12 rounded-full border-gray-300 focus-visible:ring-blue-500" disabled={isGenerating}/>
                      <Button type="submit" size="icon" className="absolute right-1 top-1 rounded-full bg-blue-600 hover:bg-blue-700" disabled={isGenerating}><Send className="w-4 h-4"/></Button>
                  </form>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}