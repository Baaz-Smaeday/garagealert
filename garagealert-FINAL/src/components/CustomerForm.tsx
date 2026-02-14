'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import type { Customer } from '@/types/database'

interface CustomerFormProps {
  garageId: string
  customer?: Customer // If provided, we're editing
}

export function CustomerForm({ garageId, customer }: CustomerFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!customer

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    preferred_channel: customer?.preferred_channel || 'sms',
    notes: customer?.notes || '',
  })

  const [consent, setConsent] = useState({
    sms: true,
    whatsapp: true,
    email: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isEditing) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customer.id)

        if (error) throw error
        toast.success('Customer updated')
        router.push(`/customers/${customer.id}`)
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert({
            garage_id: garageId,
            ...form,
          })
          .select()
          .single()

        if (error) throw error

        // Create consent records for each enabled channel
        const consentRecords = Object.entries(consent)
          .filter(([_, enabled]) => enabled)
          .map(([channel]) => ({
            customer_id: data.id,
            channel,
            status: 'opted_in' as const,
            method: 'online_form' as const,
          }))

        if (consentRecords.length > 0) {
          await supabase.from('consent_records').insert(consentRecords)
        }

        toast.success('Customer added!')
        router.push(`/customers/${data.id}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }

    router.refresh()
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first_name"
              name="first_name"
              label="First name"
              placeholder="John"
              value={form.first_name}
              onChange={handleChange}
              required
            />
            <Input
              id="last_name"
              name="last_name"
              label="Last name"
              placeholder="Smith"
              value={form.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            id="phone"
            name="phone"
            label="Mobile number"
            placeholder="07700 900000"
            value={form.phone}
            onChange={handleChange}
            helpText="UK mobile number for SMS and WhatsApp"
          />

          <Input
            id="email"
            name="email"
            label="Email address"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChange={handleChange}
          />

          <Select
            id="preferred_channel"
            name="preferred_channel"
            label="Preferred contact method"
            value={form.preferred_channel}
            onChange={handleChange}
            options={[
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
              { value: 'email', label: 'Email' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Any notes about this customer..."
              value={form.notes}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Consent checkboxes (only for new customers) */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer consent (GDPR)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Tick the channels this customer has agreed to receive messages on.
              </p>
              <div className="space-y-2">
                {(['sms', 'whatsapp', 'email'] as const).map(channel => (
                  <label key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={consent[channel]}
                      onChange={(e) => setConsent(prev => ({ ...prev, [channel]: e.target.checked }))}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              {isEditing ? 'Save Changes' : 'Add Customer'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
