'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, PageHeader } from '@/components/ui/Card'
import { PLANS } from '@/lib/stripe'
import { Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BillingPage() {
  const supabase = createClient()
  const [garage, setGarage] = useState<any>(null)
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    async function loadGarage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('garages').select('*').eq('user_id', user.id).single()
      setGarage(data)
    }
    loadGarage()
  }, [supabase])

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, interval }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to create checkout session')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(null)
  }

  const handleManageBilling = async () => {
    setLoading('manage')
    try {
      const res = await fetch('/api/stripe/create-portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch {
      toast.error('Something went wrong')
    }
    setLoading(null)
  }

  return (
    <div>
      <PageHeader title="Billing" description="Manage your subscription and payment details" />

      {/* Current plan info */}
      {garage && (
        <Card className="mb-8">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current plan</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {garage.subscription_plan || 'Free Trial'}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                Status: <span className={
                  garage.subscription_status === 'active' ? 'text-emerald-600 font-medium' :
                  garage.subscription_status === 'trialing' ? 'text-amber-600 font-medium' :
                  'text-red-600 font-medium'
                }>{garage.subscription_status}</span>
              </p>
            </div>
            {garage.stripe_customer_id && (
              <Button
                variant="secondary"
                onClick={handleManageBilling}
                loading={loading === 'manage'}
              >
                Manage Billing
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interval toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 inline-flex">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              interval === 'yearly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            Yearly <span className="text-emerald-600 text-xs ml-1">Save ~17%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => (
          <Card
            key={plan.id}
            className={`relative ${plan.popular ? 'border-brand-500 border-2 shadow-md' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-2 mb-6">
                <span className="text-3xl font-bold text-gray-900">
                  £{interval === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <span className="text-sm text-gray-500">
                  /{interval === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>

              <ul className="space-y-2.5 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'primary' : 'secondary'}
                onClick={() => handleSubscribe(plan.id)}
                loading={loading === plan.id}
              >
                {garage?.subscription_plan === plan.id ? 'Current Plan' : 'Get Started'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
