'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardContent, PageHeader } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [form, setForm] = useState({
    name: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    postcode: '',
    phone: '',
    email: '',
    website: '',
  })

  useEffect(() => {
    async function loadGarage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: garage } = await supabase
        .from('garages')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (garage) {
        setForm({
          name: garage.name || '',
          address_line_1: garage.address_line_1 || '',
          address_line_2: garage.address_line_2 || '',
          city: garage.city || '',
          postcode: garage.postcode || '',
          phone: garage.phone || '',
          email: garage.email || '',
          website: garage.website || '',
        })
      }
      setFetching(false)
    }
    loadGarage()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('garages')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Settings saved!')
    }
    setLoading(false)
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" description="Manage your garage details" />

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-gray-900">Garage Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 max-w-lg">
            <Input id="name" name="name" label="Garage name" value={form.name} onChange={handleChange} required />
            <Input id="address_line_1" name="address_line_1" label="Address line 1" value={form.address_line_1} onChange={handleChange} />
            <Input id="address_line_2" name="address_line_2" label="Address line 2" value={form.address_line_2} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input id="city" name="city" label="City / Town" value={form.city} onChange={handleChange} />
              <Input id="postcode" name="postcode" label="Postcode" value={form.postcode} onChange={handleChange} />
            </div>
            <Input id="phone" name="phone" label="Phone number" value={form.phone} onChange={handleChange} />
            <Input id="email" name="email" label="Contact email" type="email" value={form.email} onChange={handleChange} />
            <Input id="website" name="website" label="Website (optional)" value={form.website} onChange={handleChange} placeholder="https://..." />

            <Button type="submit" loading={loading}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
