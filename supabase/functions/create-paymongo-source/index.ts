// @ts-ignore - Deno global
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      amount,
      currency,       // 'PHP', 'USD' — JPY clients should be charged in USD
      paymentType,    // 'qrph' or 'card'
      customerName,
      customerEmail,
      customerPhone,
      // Card details (only required when paymentType === 'card')
      cardNumber,
      cardExpMonth,
      cardExpYear,
      cardCvc,
      bookingId,
      tourName,
      travelDate,
      withTransfer
    } = await req.json()

    // @ts-ignore - Deno global
    const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY')
    // @ts-ignore - Deno global
    const BASE_URL = Deno.env.get('BASE_URL')

    if (!PAYMONGO_SECRET_KEY || !BASE_URL) {
      throw new Error('Missing PAYMONGO_SECRET_KEY or BASE_URL environment variable')
    }

    const authHeader = `Basic ${btoa(PAYMONGO_SECRET_KEY + ':')}`

    // ── Determine currency ───────────────────────────────────────────────────
    // QRPh only works in PHP
    // Card supports PHP and USD (JPY clients pay in USD — bank handles conversion)
    const resolvedCurrency = paymentType === 'qrph' ? 'PHP' : (currency ?? 'PHP')

    // ── Step 1: Create a Payment Intent ─────────────────────────────────────
    const intentRes = await fetch('https://api.paymongo.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),   // centavos / cents
            currency: resolvedCurrency,
            payment_method_allowed: paymentType === 'card' ? ['card'] : ['qrph'],
            payment_method_options: {
              card: { request_three_d_secure: 'any' }
            },
            metadata: {
              booking_id: String(bookingId),
              tour_name: String(tourName),
              travel_date: String(travelDate),
              with_airport_transfer: String(withTransfer)
            },
            description: `Japan Tour - ${tourName}`,
            statement_descriptor: 'JAPAN TOUR'
          }
        }
      })
    })

    const intentData = await intentRes.json()

    if (!intentRes.ok) {
      console.error('Payment Intent error:', JSON.stringify(intentData))
      return new Response(JSON.stringify({ error: intentData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const paymentIntentId = intentData.data.id
    const clientKey = intentData.data.attributes.client_key

    // ── Step 2: Create a Payment Method ─────────────────────────────────────
    const paymentMethodBody = paymentType === 'card'
      ? {
          data: {
            attributes: {
              type: 'card',
              details: {
                card_number: cardNumber.replace(/\s/g, ''),
                exp_month: parseInt(cardExpMonth),
                exp_year: parseInt(cardExpYear),
                cvc: cardCvc
              },
              billing: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
              }
            }
          }
        }
      : {
          data: {
            attributes: {
              type: 'qrph',
              billing: {
                name: customerName,
                email: customerEmail,
                phone: customerPhone
              }
            }
          }
        }

    const methodRes = await fetch('https://api.paymongo.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(paymentMethodBody)
    })

    const methodData = await methodRes.json()

    if (!methodRes.ok) {
      console.error('Payment Method error:', JSON.stringify(methodData))
      return new Response(JSON.stringify({ error: methodData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const paymentMethodId = methodData.data.id

    // ── Step 3: Attach Payment Method to Intent ──────────────────────────────
    const attachRes = await fetch(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
              return_url: `${BASE_URL}/booking-confirmation?bookingId=${bookingId}&status=success`
            }
          }
        })
      }
    )

    const attachData = await attachRes.json()

    if (!attachRes.ok) {
      console.error('Attach error:', JSON.stringify(attachData))
      return new Response(JSON.stringify({ error: attachData }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const nextAction = attachData.data.attributes.next_action
    const status = attachData.data.attributes.status

    console.log('Attach status:', status)
    console.log('Next action:', JSON.stringify(nextAction))
    console.log('Full attach response:', JSON.stringify(attachData.data.attributes))

    // ── Card: may need 3DS redirect ──────────────────────────────────────────
    // ── QRPh: returns consume_qr action with QR code string ─────────────────
    const qrCode = paymentType === 'qrph' 
      ? nextAction?.code ?? attachData.data.attributes.actions?.[0]?.code ?? null
      : null

    return new Response(
      JSON.stringify({
        status,
        payment_intent_id: paymentIntentId,
        payment_type: paymentType,
        // QRPh fields
        qr_code: qrCode,
        // Card 3DS redirect (if required by issuing bank)
        redirect_url: nextAction?.redirect?.url ?? null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Edge function error:', errorMessage)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})