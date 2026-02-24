import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2"; // Added ONLY the import

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
    // ISOLATED TRAINING BLOCK (Will NOT crash the rest of the app)
    // =========================================================================
    if (action === "add-document") {
      try {
        const { content } = payload;
        
        // 1. Get Google Math (Vector)
        const embedRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: { parts: [{ text: content }] }
          }),
        });
        
        const embedData = await embedRes.json();
        
        // Give us the EXACT Google error if it fails
        if (embedData.error) {
          return new Response(JSON.stringify({ error: `Google Error: ${embedData.error.message}` }), { status: 500, headers: corsHeaders });
        }
        
        const embedding = embedData.embedding?.values;
        if (!embedding) throw new Error("Google returned no math.");

        // 2. Connect to Database ONLY when training is triggered
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        // Fallback to ANON_KEY if SERVICE_ROLE is hidden by the environment
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { error: dbError } = await supabase.from('company_documents').insert({ content, embedding });
        
        if (dbError) throw new Error(`Database Error: ${dbError.message}`);

        return new Response(JSON.stringify({ success: true, message: "Successfully injected into AI Brain!" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: `Training Failed: ${err.message}` }), { status: 500, headers: corsHeaders });
      }
    }
    // =========================================================================

    // WEATHER SERVICE (Untouched)
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

    // SMART ITINERARY AGENT (Untouched)
    if (action === "generate-itinerary" || action === "chat-revision") {
      const { destinations, days, userPrompt, currentItinerary, startDate } = payload;
      
      const prompt = `
        You are the expert consultant for Unclesam Tours.
        CONTEXT:
        - Trip: ${days} days in ${destinations?.join(", ")} starting ${startDate || "2026-02-18"}.
        - STRICT RULE: Unclesam Tours provides PRIVATE DRIVERS. NEVER suggest trains, subways, or buses. ALWAYS "Private Driver transfer".
        - Current Plan: ${JSON.stringify(currentItinerary)}
        - User Input: "${userPrompt}"

        YOUR TASK:
        Classify the user's input and return JSON.
        
        IF USER ASKS A QUESTION (e.g., "Is there coffee?", "How far is X?"):
        {
          "type": "inquiry",
          "message": "Direct answer to the question. Suggest specific places if asked."
        }

        IF USER WANTS A CHANGE (e.g., "Add coffee shop", "Swap day 1"):
        {
          "type": "update",
          "message": "Brief confirmation (e.g. 'Added Starbucks to Day 1').",
          "itinerary": [ ...Full Array of Day Objects... ] 
        }

        ITINERARY FORMAT RULE:
        "itinerary" must be an array of: { "day": 1, "date": "...", "items": [{ "time": "09:00", "activity": "...", "location": "..." }] }
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