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
      const { destinations, days, userPrompt, currentItinerary } = payload;
      
      // We force Gemini to use this EXACT structure so the map() function doesn't fail
      const schema = `
        Return a JSON array of objects. Each object MUST have:
        "day": number, "date": "YYYY-MM-DD", 
        "items": Array of { "id": string, "time": string, "activity": string, "location": string, "duration": string, "type": "sightseeing"|"meal"|"travel" }
      `;

      const prompt = action === "generate-itinerary" 
        ? `Create a ${days}-day trip for ${destinations.join(", ")}. ${schema}`
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
      const aiContent = data.candidates[0].content.parts[0].text;
      return new Response(aiContent, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "fetch-weather") {
      const { location } = payload;
      // We use the first destination if the location is vague
      const query = location || "Tokyo";
      const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${OPENWEATHER_API_KEY}`);
      const weatherData = await weatherRes.json();
      
      return new Response(JSON.stringify({
        condition: weatherData.weather?.[0]?.main || "Sunny",
        temp: `${Math.round(weatherData.main?.temp || 20)}°C`,
        description: weatherData.weather?.[0]?.description || "Clear skies"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});