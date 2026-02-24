import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 1. Explicitly define what a Package looks like to stop the 'any' errors
interface TourPackage {
  id: string | number;
  price: number;
}

serve(async (req: Request): Promise<Response> => {
  // Use 'as string' to satisfy compiler if env might be undefined
  const apiKey = (Deno.env.get('FXRATES_API_KEY') || '').trim();

  try {
    const url = `https://api.fxratesapi.com/latest?currencies=USD,PHP,JPY&api_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned status ${response.status}`);

    const apiData = await response.json();
    const rates = apiData.rates; 

    // Manual cross-rate calculation
    const rawJpyToUsd = 1 / rates.JPY;
    const rawJpyToPhp = rates.PHP / rates.JPY;

    // Margin Math
    const usdRateSafe = rawJpyToUsd / 0.93; 
    const phpRateSafe = rawJpyToPhp / 0.95;

    // 2. Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Fetch all tour packages
    const { data, error: fetchError } = await supabase
      .from('tour_packages')
      .select('id, price')
      .neq('price', 0);

    if (fetchError) throw fetchError;

    // 4. Cast data to our Interface to fix 'pkg' any type
    const packages = data as TourPackage[];

    const updates = packages.map((pkg: TourPackage) => ({
      id: pkg.id,
      price_usd: parseFloat((pkg.price * usdRateSafe).toFixed(2)),
      price_php: Math.ceil(pkg.price * phpRateSafe), 
      last_rate_sync: new Date().toISOString()
    }));

    // 5. Execute Update
    const { error: updateError } = await supabase.from('tour_packages').upsert(updates);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      rates_used: { USD_buffered: usdRateSafe, PHP_buffered: phpRateSafe }
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err: unknown) {
    // Fixes the 'err is type unknown' error by narrowing the type
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Function error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
})
 