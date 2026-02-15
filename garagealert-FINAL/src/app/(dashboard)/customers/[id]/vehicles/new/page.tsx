'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function AddVehiclePage({
  params,
}: {
  params: { id: string }
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    registration: '',
    make: '',
    model: '',
    year: '',
    colour: '',
    mot_due_date: '',
    last_service_date: '',
    next_service_date: '',
    mileage: '',
    mot_reminder_enabled: true,
    service_reminder_enabled: true,
    tyre_reminder_enabled: false,
    repair_reminder_enabled: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      const { data: garage } = await supabase
        .from('garages')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!garage) {
        toast.error('Garage not found')
        return
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('id', params.id)
        .eq('garage_id', garage.id)
        .single()

      if (!customer) {
        toast.error('Customer not found')
        return
      }

      const { error } = await supabase.from('vehicles').insert({
        customer_id: params.id,
        garage_id: garage.id,
        registration: form.registration.toUpperCase().replace(/\s/g, ''),
        make: form.make,
        model: form.model,
        year: form.year ? parseInt(form.year) : null,
        colour: form.colour || null,
        mot_due_date: form.mot_due_date || null,
        last_service_date: form.last_service_date || null,
        next_service_date: form.next_service_date || null,
        mileage: form.mileage ? parseInt(form.mileage) : null,
        mot_reminder_enabled: form.mot_reminder_enabled,
        service_reminder_enabled: form.service_reminder_enabled,
        tyre_reminder_enabled: form.tyre_reminder_enabled,
        repair_reminder_enabled: form.repair_reminder_enabled,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Vehicle added successfully!')
      router.push(`/customers/${params.id}`)
      router.refresh()
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Add Vehicle</h1>
        <p className="text-sm text-gray-500 mt-1">Add a vehicle for this customer to track MOTs, services, and send reminders.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Vehicle Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="registration" className="block text-sm font-medium text-gray-700 mb-1">
                Registration number <span className="text-red-500">*</span>
              </label>
              <input
                id="registration"
                name="registration"
                type="text"
                required
                placeholder="AB12 CDE"
                value={form.registration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">
                  Make <span className="text-red-500">*</span>
                </label>
                <input
                  id="make"
                  name="make"
                  type="text"
                  required
                  placeholder="e.g. Ford"
                  value={form.make}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  id="model"
                  name="model"
                  type="text"
                  required
                  placeholder="e.g. Focus"
                  value={form.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input id="year" name="year" type="number" placeholder="e.g. 2020" min="1900" max="2030" value={form.year} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label htmlFor="colour" className="block text-sm font-medium text-gray-700 mb-1">Colour</label>
                <input id="colour" name="colour" type="text" placeholder="e.g. Silver" value={form.colour} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input id="mileage" name="mileage" type="number" placeholder="e.g. 45000" value={form.mileage} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Important Dates</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="mot_due_date" className="block text-sm font-medium text-gray-700 mb-1">MOT due date</label>
              <input id="mot_due_date" name="mot_due_date" type="date" value={form.mot_due_date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="last_service_date" className="block text-sm font-medium text-gray-700 mb-1">Last service date</label>
              <input id="last_service_date" name="last_service_date" type="date" value={form.last_service_date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="next_service_date" className="block text-sm font-medium text-gray-700 mb-1">Next service due</label>
              <input id="next_service_date" name="next_service_date" type="date" value={form.next_service_date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Reminder Settings</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500 mb-2">Choose which reminders to send for this vehicle:</p>
            {[
              { name: 'mot_reminder_enabled', label: 'MOT reminder' },
              { name: 'service_reminder_enabled', label: 'Service reminder' },
              { name: 'tyre_reminder_enabled', label: 'Tyre check reminder' },
              { name: 'repair_reminder_enabled', label: 'Repair follow-up reminder' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" name={name} checked={(form as any)[name]} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Add Vehicle</Button>
          <Link href={`/customers/${params.id}`}>
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
