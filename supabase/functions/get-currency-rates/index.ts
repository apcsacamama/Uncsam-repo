// supabase/functions/get-currency-rates/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Grab the secret key you'll set in the next step
  const apiKey = Deno.env.get('CURRENCY_API_KEY')
  
  try {
    // 1. Fetch live rates from the API (JPY base)
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`)
    const apiData = await res.json()
    
    const usdRate = apiData.conversion_rates.USD
    const phpRate = apiData.conversion_rates.PHP

    // 2. Initialize Supabase with System-Level access (Service Role)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Update the database. This logic assumes your JPY price is in the 'price' column.
    // It updates price_usd and price_php for every row.
    const { data, error } = await supabase
      .from('tour_packages')
      .select('id, price')

    if (data) {
      for (const pkg of data) {
        await supabase
          .from('tour_packages')
          .update({ 
            price_usd: pkg.price * usdRate,
            price_php: pkg.price * phpRate 
          })
          .eq('id', pkg.id)
      }
    }

    return new Response(JSON.stringify({ message: "Rates updated successfully!" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    })
  }
})