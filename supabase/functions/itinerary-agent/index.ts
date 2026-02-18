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

    if (action === "fetch-weather") {
        // ... (Weather code remains the same) ...
        const { location } = payload;
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location || "Tokyo")}&units=metric&appid=${OPENWEATHER_API_KEY}`);
        const data = await weatherRes.json();
        return new Response(JSON.stringify({
          condition: data.weather?.[0]?.main || "Sunny",
          temp: data.main?.temp ? `${Math.round(data.main.temp)}°C` : "25°C",
          summary: data.weather?.[0]?.description || "Clear"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "generate-itinerary" || action === "chat-revision") {
      const { destinations, days, userPrompt, currentItinerary, startDate } = payload;

      const prompt = `
        You are the AI planner for Unclesam Tours.
        TASK: Create a ${days}-day itinerary for ${destinations?.join(", ") || "Japan"}.
        START DATE: ${startDate || "2026-02-17"}.
        RULES: Private driver only. Lunch format: "Lunch near [Previous Location]".
        OUTPUT: Return ONLY valid JSON array.
        ${userPrompt ? `USER REQUEST: "${userPrompt}"` : ""}
        ${currentItinerary ? `CONTEXT: ${JSON.stringify(currentItinerary)}` : ""}
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      const data = await response.json();

      // --- DEBUGGING BLOCK: CATCH API ERRORS ---
      if (data.error) {
        // This will print the REAL error (Quota, Key, etc.) to your frontend
        throw new Error(`Gemini API Error: ${data.error.message}`);
      }

      if (!data.candidates || !data.candidates[0]) {
        throw new Error("AI returned an empty response (Safety Filter triggered?).");
      }
      // ----------------------------------------

      const aiContent = data.candidates[0].content.parts[0].text;
      return new Response(aiContent, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});