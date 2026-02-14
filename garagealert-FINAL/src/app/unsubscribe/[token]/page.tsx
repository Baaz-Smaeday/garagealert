'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Bell, CheckCircle } from 'lucide-react'

export default function UnsubscribePage() {
  const params = useParams()
  const customerId = params.token as string
  const supabase = createClient()
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleUnsubscribe = async () => {
    setLoading(true)

    // Insert opt-out records for all channels
    for (const channel of ['sms', 'whatsapp', 'email']) {
      await supabase.from('consent_records').insert({
        customer_id: customerId,
        channel,
        status: 'opted_out',
        method: 'unsubscribe_link',
      })
    }

    setDone(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>

        {done ? (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;ve been unsubscribed</h1>
            <p className="text-sm text-gray-500">
              You will no longer receive reminder messages. If this was a mistake,
              please contact your garage directly.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe from reminders</h1>
            <p className="text-sm text-gray-500 mb-6">
              Click below to stop receiving MOT, service, and other reminder messages.
            </p>
            <Button onClick={handleUnsubscribe} loading={loading} variant="danger" className="w-full">
              Unsubscribe
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              You can always re-subscribe by contacting your garage.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
