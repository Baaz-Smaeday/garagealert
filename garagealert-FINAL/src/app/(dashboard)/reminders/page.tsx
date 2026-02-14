import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Bell } from 'lucide-react'
import { formatDateUK, getStatusColor } from '@/lib/utils'

export default async function RemindersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages').select('id').eq('user_id', user.id).single()
  if (!garage) redirect('/login')

  const { data: reminders } = await supabase
    .from('scheduled_reminders')
    .select('*, customers(first_name, last_name), vehicles(registration)')
    .eq('garage_id', garage.id)
    .order('scheduled_for', { ascending: true })
    .limit(100)

  return (
    <div>
      <PageHeader title="Reminders" description="Upcoming and recent automated reminders" />
      <Card>
        {reminders && reminders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Date</th>
                  <th className="px-6 py-3 text-left font-medium">Customer</th>
                  <th className="px-6 py-3 text-left font-medium">Vehicle</th>
                  <th className="px-6 py-3 text-left font-medium">Type</th>
                  <th className="px-6 py-3 text-left font-medium">Channel</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reminders.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-700">{formatDateUK(r.scheduled_for)}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {r.customers?.first_name} {r.customers?.last_name}
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-700">{r.vehicles?.registration}</td>
                    <td className="px-6 py-3 uppercase text-xs font-medium text-gray-600">{r.reminder_type}</td>
                    <td className="px-6 py-3 capitalize text-gray-600">{r.channel}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Bell className="w-12 h-12" />}
            title="No reminders yet"
            description="Reminders are generated automatically when you add vehicles with due dates."
          />
        )}
      </Card>
    </div>
  )
}
