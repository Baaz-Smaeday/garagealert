import { NextRequest, NextResponse } from 'next/server'
import { getStripe, PRICE_IDS } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { plan, interval } = await request.json()
  const priceId = PRICE_IDS[plan]?.[interval]
  if (!priceId) return NextResponse.json({ error: 'Invalid plan or interval' }, { status: 400 })

  const { data: garage } = await supabase
    .from('garages').select('stripe_customer_id').eq('user_id', user.id).single()

  let customerId = garage?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('garages').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?cancelled=true`,
    subscription_data: {
      trial_period_days: 14,
      metadata: { plan },
    },
  })

  return NextResponse.json({ url: session.url })
}
