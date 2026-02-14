import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  const stripe = getStripe()
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: garage } = await supabase
    .from('garages').select('stripe_customer_id').eq('user_id', user.id).single()

  if (!garage?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: garage.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  return NextResponse.json({ url: session.url })
}
