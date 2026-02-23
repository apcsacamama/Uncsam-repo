import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Built-in Deno crypto — no external imports needed
async function verifySignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  expectedSig: string
): Promise<boolean> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const message = `${timestamp}.${rawBody}`
  const sigBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  const computedSig = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return computedSig === expectedSig
}

serve(async (req) => {
  try {
    const rawBody = await req.text()

    // ── Signature verification ──────────────────────────────────────────────
    const WEBHOOK_SECRET = Deno.env.get('PAYMONGO_WEBHOOK_SECRET')
    if (WEBHOOK_SECRET) {
      const signature = req.headers.get('Paymongo-Signature')
      if (!signature) {
        return new Response('Missing signature', { status: 401 })
      }

      const parts = Object.fromEntries(signature.split(',').map(p => p.split('=')))
      const timestamp = parts['t']
      const expectedSig = parts['te'] ?? parts['li']

      const valid = await verifySignature(WEBHOOK_SECRET, timestamp, rawBody, expectedSig)
      if (!valid) {
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const body = JSON.parse(rawBody)
    const event = body.data
    const eventType = event.attributes.type
    const paymentData = event.attributes.data

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Safely extract booking ID from metadata
    const bookingId =
      paymentData?.attributes?.metadata?.booking_id ??
      paymentData?.attributes?.source?.metadata?.booking_id

    console.log(`Webhook received: ${eventType} | bookingId: ${bookingId}`)

    switch (eventType) {

      // ── Payment succeeded ─────────────────────────────────────────────────
      case 'payment.paid':
        if (!bookingId) {
          console.error('No bookingId found in payment metadata')
          break
        }

        await supabase
          .from('bookings')
          .update({ status: 'confirmed' })
          .eq('id', bookingId)

        await supabase.from('payments').insert({
          booking_id: bookingId,
          payment_gateway: 'paymongo',
          gateway_payment_id: paymentData.id,
          payment_method: 'qrph',
          currency: 'PHP',
          amount: paymentData.attributes.amount / 100,
          status: 'paid',
          paid_at: new Date().toISOString(),
          metadata: paymentData
        })
        break

      // ── Payment failed ────────────────────────────────────────────────────
      case 'payment.failed':
        if (!bookingId) break

        await supabase
          .from('bookings')
          .update({ status: 'payment_failed' })
          .eq('id', bookingId)

        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('booking_id', bookingId)
        break

      // ── QR code expired ───────────────────────────────────────────────────
      case 'qrph.expired':
        if (!bookingId) break

        await supabase
          .from('bookings')
          .update({ status: 'payment_expired' })
          .eq('id', bookingId)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})