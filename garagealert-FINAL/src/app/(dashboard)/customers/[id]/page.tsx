import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardHeader, CardContent, PageHeader, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Car } from 'lucide-react'
import { formatDateUK, getMOTStatusColor, formatRegistration } from '@/lib/utils'
import Link from 'next/link'

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!garage) redirect('/login')

  // Get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', params.id)
    .eq('garage_id', garage.id)
    .single()

  if (!customer) notFound()

  // Get vehicles for this customer
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })

  // Get consent records
  const { data: consentRecords } = await supabase
    .from('consent_records')
    .select('*')
    .eq('customer_id', customer.id)
    .order('collected_at', { ascending: false })

  // Get message history
  const { data: messages } = await supabase
    .from('message_logs')
    .select('*')
    .eq('customer_id', customer.id)
    .order('sent_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <PageHeader
        title={`${customer.first_name} ${customer.last_name}`}
        description={`Customer since ${formatDateUK(customer.created_at)}`}
        action={
          <div className="flex gap-2">
            <Link href={`/customers/${customer.id}`}>
              <Button variant="secondary">Edit</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="text-base font-semibold text-gray-900">Contact Details</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900">{customer.phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Preferred channel</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{customer.preferred_channel}</p>
            </div>
            {customer.notes && (
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}

            {/* Consent status */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Consent Status</p>
              {(['sms', 'whatsapp', 'email'] as const).map(channel => {
                const latest = consentRecords?.find(c => c.channel === channel)
                const isOptedIn = latest?.status === 'opted_in'
                return (
                  <div key={channel} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 capitalize">{channel}</span>
                    <span className={`text-xs font-medium ${isOptedIn ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isOptedIn ? '✓ Opted in' : '✗ Opted out'}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Vehicles */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Vehicles ({vehicles?.length || 0})
                </h2>
                <Link href={`/customers/${customer.id}/vehicles/new`}>
                  <Button variant="primary" className="flex items-center gap-1.5 text-sm">
                    <Plus className="w-4 h-4" /> Add Vehicle
                  </Button>
                </Link>
              </div>
            </CardHeader>
            {vehicles && vehicles.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {vehicles.map((v: any) => (
                  <div key={v.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-bold text-gray-900 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded font-mono">
                          {formatRegistration(v.registration)}
                        </span>
                        <span className="text-sm text-gray-500 ml-3">
                          {v.make} {v.model} {v.year ? `(${v.year})` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">MOT Due</p>
                        <p className={`text-sm font-medium ${getMOTStatusColor(v.mot_due_date)}`}>
                          {formatDateUK(v.mot_due_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Service</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateUK(v.last_service_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Mileage</p>
                        <p className="text-sm font-medium text-gray-900">
                          {v.mileage ? v.mileage.toLocaleString() + ' mi' : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reminders</p>
                        <div className="flex gap-1 mt-0.5">
                          {v.mot_reminder_enabled && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">MOT</span>}
                          {v.service_reminder_enabled && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">SVC</span>}
                          {v.tyre_reminder_enabled && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">TYRE</span>}
                          {v.repair_reminder_enabled && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">RPR</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Car className="w-10 h-10" />}
                title="No vehicles"
                description="Add this customer's vehicle to start sending reminders."
              />
            )}
          </Card>

          {/* Message history */}
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold text-gray-900">Message History</h2>
            </CardHeader>
            {messages && messages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-6 py-2 text-left">Date</th>
                      <th className="px-6 py-2 text-left">Channel</th>
                      <th className="px-6 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {messages.map((msg: any) => (
                      <tr key={msg.id}>
                        <td className="px-6 py-2 text-gray-600">{formatDateUK(msg.sent_at)}</td>
                        <td className="px-6 py-2 capitalize text-gray-600">{msg.channel}</td>
                        <td className="px-6 py-2">
                          <span className={`text-xs font-medium capitalize ${
                            msg.status === 'delivered' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {msg.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No messages sent to this customer yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
