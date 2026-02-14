import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Car } from 'lucide-react'
import { formatDateUK, getMOTStatusColor, formatRegistration } from '@/lib/utils'
import Link from 'next/link'

export default async function VehiclesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!garage) redirect('/login')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, customers(first_name, last_name)')
    .eq('garage_id', garage.id)
    .order('mot_due_date', { ascending: true })

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description={`${vehicles?.length || 0} vehicles tracked`}
      />

      <Card>
        {vehicles && vehicles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Registration</th>
                  <th className="px-6 py-3 text-left font-medium">Make / Model</th>
                  <th className="px-6 py-3 text-left font-medium">Customer</th>
                  <th className="px-6 py-3 text-left font-medium">MOT Due</th>
                  <th className="px-6 py-3 text-left font-medium">Last Service</th>
                  <th className="px-6 py-3 text-left font-medium">Mileage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <span className="text-sm font-bold text-gray-900 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded font-mono">
                        {formatRegistration(v.registration)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-700">
                      {v.make} {v.model}
                    </td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/customers/${v.customer_id}`}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                      >
                        {v.customers?.first_name} {v.customers?.last_name}
                      </Link>
                    </td>
                    <td className={`px-6 py-3.5 font-medium ${getMOTStatusColor(v.mot_due_date)}`}>
                      {formatDateUK(v.mot_due_date)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {formatDateUK(v.last_service_date)}
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {v.mileage ? v.mileage.toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Car className="w-12 h-12" />}
            title="No vehicles yet"
            description="Vehicles will appear here when you add them to customers."
          />
        )}
      </Card>
    </div>
  )
}
