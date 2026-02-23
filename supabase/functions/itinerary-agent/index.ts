import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    // =========================================================================
    // ISOLATED KNOWLEDGE INJECTOR (RAG Phase 2)
    // =========================================================================
    if (action === "add-document") {
      try {
        const { content } = payload;
        if (!content) throw new Error("Content is required.");
        if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing.");

        const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: { parts: [{ text: content }] },
            taskType: "RETRIEVAL_DOCUMENT",
            outputDimensionality: 768
          }),
        });

        const embedData = await embedRes.json();
        if (embedData.error) return new Response(JSON.stringify({ error: `Google API Error: ${embedData.error.message}` }), { status: 500, headers: corsHeaders });

        const embedding = embedData.embedding?.values;
        if (!embedding) throw new Error("Google returned no math.");

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error: dbError } = await supabase.from('company_documents').insert({ content, embedding });
        if (dbError) throw new Error(`Supabase Database Error: ${dbError.message}`);

        return new Response(JSON.stringify({ success: true, message: "Knowledge successfully injected into Unclesam Tours Brain!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: `Training Failed: ${err.message}` }), { status: 500, headers: corsHeaders });
      }
    }
    // =========================================================================


    // WEATHER SERVICE
    if (action === "fetch-weather") {
      const { location } = payload;
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location || "Tokyo")}&units=metric&appid=${OPENWEATHER_API_KEY}`);
        const data = await res.json();
        return new Response(JSON.stringify({
          condition: data.weather?.[0]?.main || "Clear",
          temp: `${Math.round(data.main?.temp || 20)}°C`,
          summary: data.weather?.[0]?.description || "Fair"
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ condition: "Clear", temp: "20°C", summary: "Fair" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // SMART ITINERARY AGENT
    if (action === "generate-itinerary" || action === "chat-revision") {
      // Notice we are pulling tourNames now!
      const { tourNames, days, userPrompt, currentItinerary, startDate } = payload;
      
      const prompt = `
        You are the expert consultant for Unclesam Tours.
        CONTEXT:
        - Trip Details: ${days} days starting on ${startDate || "2026-02-18"}.
        - Booked Tours: ${tourNames?.join(" | ")}
        - STRICT DAY COUNT RULE: You MUST generate EXACTLY ${days} separate day objects in the array. Map one booked tour to each day. DO NOT put all activities on Day 1.
        - STRICT TRANSPORT RULE: Unclesam Tours provides PRIVATE DRIVERS. NEVER suggest trains, subways, or buses. ALWAYS "Private Driver transfer".
        - LOCATION RULE: You MUST suggest REAL, verified, and accurate places, restaurants, and attractions in Japan.
        - Current Plan: ${JSON.stringify(currentItinerary)}
        - User Input: "${userPrompt}"

        YOUR TASK:
        Classify the user's input and return JSON.
        
        IF USER ASKS A QUESTION:
        { "type": "inquiry", "message": "Direct answer." }

        IF USER WANTS A CHANGE or INITIAL GENERATION:
        { "type": "update", "message": "Brief confirmation.", "itinerary": [ ...Full Array of Day Objects... ] }

        ITINERARY FORMAT RULE:
        "itinerary" must be an array of EXACTLY ${days} objects formatted like this:
        { "day": 1, "tourName": "Name of the Specific Tour", "date": "...", "items": [{ "time": "09:00", "activity": "...", "location": "..." }] }
        NO MARKDOWN. RAW JSON ONLY.
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
      const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!aiContent) throw new Error("AI Busy");

      return new Response(aiContent, { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});