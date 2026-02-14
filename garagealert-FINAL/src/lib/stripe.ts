import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16',
    })
  }
  return _stripe
}

// Keep backward compat
export const stripe = null as any // Use getStripe() instead

// Map plan names to Stripe Price IDs from environment variables
export const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || '',
  },
  growth: {
    monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY || '',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  },
}

// Plan features for display
export const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      'Up to 200 customers',
      'Up to 400 vehicles',
      '200 SMS/month included',
      '200 WhatsApp/month included',
      'Unlimited emails',
      'MOT + Service reminders',
      '5 message templates',
      '30-day message log',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 59,
    yearlyPrice: 590,
    popular: true,
    features: [
      'Up to 500 customers',
      'Up to 1,000 vehicles',
      '500 SMS/month included',
      '500 WhatsApp/month included',
      'Unlimited emails',
      'All 4 reminder types',
      '15 message templates',
      '90-day message log',
      'DVLA auto-lookup (Phase 2)',
      'Online booking link (Phase 2)',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      'Unlimited customers',
      'Unlimited vehicles',
      '1,500 SMS/month included',
      '1,500 WhatsApp/month included',
      'Unlimited emails',
      'All 4 reminder types',
      'Unlimited templates',
      '12-month message log',
      'Up to 10 team members (Phase 2)',
      'Priority support',
    ],
  },
]
