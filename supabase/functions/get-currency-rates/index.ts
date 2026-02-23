// @ts-ignore - Deno global
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - External ESM import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  // @ts-ignore - Deno global
  const apiKey = Deno.env.get('FXRATES_API_KEY')?.trim();

  try {
    // 1. Fetch live rates. We keep USD, PHP, and JPY in the currencies option.
    // We fetch relative to USD (the safest API base) to calculate cross-rates manually.
    const url = `https://api.fxratesapi.com/latest?currencies=USD,PHP,JPY&api_key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned status ${response.status}`);

    const apiData = await response.json();
    const rates = apiData.rates; 

    /**
     * MANUAL CROSS-RATE CALCULATION
     * This ensures the math works even if the API base defaults to USD.
     * 1 JPY in USD = (1 / JPY_Rate)
     * 1 JPY in PHP = (PHP_Rate / JPY_Rate)
     */
    const rawJpyToUsd = 1 / rates.JPY;
    const rawJpyToPhp = rates.PHP / rates.JPY;

    /**
     * REVENUE PROTECTION (Margin Math)
     * We DIVIDE by the retention factor to ensure the price is HIGHER than market.
     * USD_PROTECTION (0.93) = 7% Buffer
     * PHP_PROTECTION (0.95) = 5% Buffer
     */
    const usdRateSafe = rawJpyToUsd / 0.93; 
    const phpRateSafe = rawJpyToPhp / 0.95;

    console.log(`Live Market JPY-USD: ${rawJpyToUsd.toFixed(6)}`);
    console.log(`Your Buffered JPY-USD: ${usdRateSafe.toFixed(6)} (This is higher than Google)`);

    // 2. Connect to Supabase
    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore - Deno global
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Fetch all tour packages
    const { data: packages, error: fetchError } = await supabase
      .from('tour_packages')
      .select('id, price')
      .neq('price', 0);

    if (fetchError) throw fetchError;

    // 4. Prepare Batch Update
    const updates = packages.map((pkg: any) => ({
      id: pkg.id,
      // Result: Higher than Google market rate to cover PayMongo/Bank fees
      price_usd: parseFloat((pkg.price * usdRateSafe).toFixed(2)),
      // Result: Clean whole number with 5% buffer
      price_php: Math.ceil(pkg.price * phpRateSafe), 
      last_rate_sync: new Date().toISOString()
    }));

    // 5. Execute Update
    const { error: updateError } = await supabase.from('tour_packages').upsert(updates);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      rates_used: { 
        USD_buffered: usdRateSafe, 
        PHP_buffered: phpRateSafe 
      }
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Function error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
})