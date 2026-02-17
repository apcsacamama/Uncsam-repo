import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UNCLESAM_RULES = `
  You are the AI expert for "Unclesam Tours".
  MANDATORY RULES:
  1. TRANSPORTATION: PRIVATE DRIVER ONLY.
  2. DOOR-TO-DOOR: Start with "Driver Pickup" and end with "Driver Drop-off".
  3. LUNCH: Label as "Lunch near [Previous Location]".
  4. RECOMMENDATIONS: Provide 3 options. Format: "**Name** (**Menu**) - Description."
  5. REVISIONS: Only rebuild JSON if user says "add", "change", "remove". Otherwise, just chat.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();

    // 1. WEATHER (Safe Mode)
    if (action === "fetch-weather") {
      try {
        const { location } = payload;
        const query = location || "Tokyo";
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${OPENWEATHER_API_KEY}`);
        const weatherData = await weatherRes.json();
        return new Response(JSON.stringify({
          condition: weatherData.weather?.[0]?.main || "Sunny",
          temp: `${Math.round(weatherData.main?.temp || 20)}°C`,
          description: weatherData.weather?.[0]?.description || "Clear skies"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ condition: "Sunny", temp: "20°C" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // 2. AI GENERATION
    if (action === "generate-itinerary" || action === "chat-revision") {
      const { destinations, days, userPrompt, currentItinerary, pickupAddress, startTime, startDate } = payload;

      // SAFEGUARD: Ensure destinations is always a string, never crash
      const destString = Array.isArray(destinations) ? destinations.join(", ") : (destinations || "Japan");
      
      const isRevision = action === "chat-revision";
      const userMessage = (userPrompt || "").toLowerCase();
      const isModification = userMessage.includes("add") || userMessage.includes("remove") || userMessage.includes("change") || userMessage.includes("put") || userMessage.includes("update");

      // --- SUB-CASE 2A: FREE CHAT (Recommendation) ---
      if (isRevision && !isModification) {
        const chatPrompt = `
          ${UNCLESAM_RULES}
          CONTEXT: Trip to ${destString}.
          QUESTION: "${userPrompt}"
          INSTRUCTION: Answer in plain text. Recommend 3 places if asked.
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: chatPrompt }] }] }),
        });
        
        const data = await response.json();
        
        // SAFEGUARD: Check if Gemini actually replied before accessing [0]
        const chatReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting to the recommendation service. Please try asking again!";
        
        return new Response(JSON.stringify({ type: "chat", message: chatReply }), { 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // --- SUB-CASE 2B: FULL ITINERARY ---
      const schema = `JSON array of objects: [{"day":number,"date":"YYYY-MM-DD","items":[{"id":"string","time":"HH:MM","activity":"string","location":"string","duration":"string","type":"sightseeing"}]}]`;
      
      const mainPrompt = `
        ${UNCLESAM_RULES}
        TASK: ${action === "generate-itinerary" ? "Create" : "Update"} a ${days}-day trip for ${destString}.
        START DATE: ${startDate || "2026-02-17"}.
        DETAILS: Start ${startTime || "09:00"}. Pickup: ${pickupAddress || "Hotel"}.
        CONTEXT: ${JSON.stringify(currentItinerary || [])}.
        USER REQUEST: "${userPrompt}".
        OUTPUT: ${schema}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: mainPrompt }] }] }),
      });

      const data = await response.json();
      
      // SAFEGUARD: Fallback if AI fails
      if (!data.candidates || !data.candidates[0]) {
        throw new Error("AI Service Overloaded - Try again");
      }

      const aiContent = data.candidates[0].content.parts[0].text;
      return new Response(aiContent, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (error) {
    // CRITICAL: Return a 200 OK with an error message so Frontend doesn't crash
    return new Response(JSON.stringify({ type: "chat", message: `System Error: ${error.message}` }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});