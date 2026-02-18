import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, payload } = await req.json();

    if (action === "generate-itinerary" || action === "chat-revision") {
      const { destinations, days, userPrompt, currentItinerary, startDate } = payload;
      
      const schema = `
        STRICT JSON ONLY. No markdown.
        Output MUST be an Array of Objects.
        Each object must have: "day": number, "date": "YYYY-MM-DD", "items": Array of { "time": "09:00", "activity": "Title", "location": "Place", "duration": "2h" }
      `;

      const prompt = action === "generate-itinerary" 
        ? `Create a ${days}-day trip for ${destinations.join(", ")} starting ${startDate || "2026-02-18"}. ${schema}`
        : `Update this itinerary: ${JSON.stringify(currentItinerary)} based on: ${userPrompt}. ${schema}`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      const data = await response.json();
      
      // Safety Check
      if (!data.candidates || !data.candidates[0]) {
        throw new Error("AI is busy. Please try again.");
      }

      const aiContent = data.candidates[0].content.parts[0].text;
      return new Response(aiContent, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "fetch-weather") {
      const { location } = payload;
      const query = location || "Tokyo";
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${OPENWEATHER_API_KEY}`);
        const weatherData = await weatherRes.json();
        return new Response(JSON.stringify({
          condition: weatherData.weather?.[0]?.main || "Sunny",
          temp: `${Math.round(weatherData.main?.temp || 20)}°C`,
          summary: weatherData.weather?.[0]?.description || "Clear skies"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ condition: "Sunny", temp: "20°C", summary: "Fair" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});