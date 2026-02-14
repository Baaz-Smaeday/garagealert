import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')
  const supabaseAdmin = getSupabaseAdmin()
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Stripe webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status
      const plan = subscription.metadata?.plan || 'starter'

      let appStatus = 'active'
      if (status === 'trialing') appStatus = 'trialing'
      if (status === 'canceled' || status === 'unpaid') appStatus = 'cancelled'
      if (status === 'past_due') appStatus = 'past_due'

      await supabaseAdmin
        .from('garages')
        .update({ subscription_status: appStatus, subscription_plan: plan })
        .eq('stripe_customer_id', customerId)
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await supabaseAdmin
        .from('garages')
        .update({ subscription_status: 'cancelled' })
        .eq('stripe_customer_id', subscription.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
