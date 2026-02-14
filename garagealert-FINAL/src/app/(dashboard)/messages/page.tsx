import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Mail } from 'lucide-react'
import { formatDateUK, getStatusColor } from '@/lib/utils'

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages').select('id').eq('user_id', user.id).single()
  if (!garage) redirect('/login')

  const { data: messages } = await supabase
    .from('message_logs')
    .select('*, customers(first_name, last_name)')
    .eq('garage_id', garage.id)
    .order('sent_at', { ascending: false })
    .limit(100)

  // Quick stats
  const total = messages?.length || 0
  const delivered = messages?.filter((m: any) => m.status === 'delivered').length || 0
  const failed = messages?.filter((m: any) => m.status === 'failed').length || 0

  return (
    <div>
      <PageHeader title="Message Log" description="All sent messages and their delivery status" />

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">{delivered}</p>
          <p className="text-xs text-gray-500">Delivered</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-600">{failed}</p>
          <p className="text-xs text-gray-500">Failed</p>
        </div>
      </div>

      <Card>
        {messages && messages.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Sent</th>
                  <th className="px-6 py-3 text-left font-medium">Customer</th>
                  <th className="px-6 py-3 text-left font-medium">Channel</th>
                  <th className="px-6 py-3 text-left font-medium">Recipient</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((msg: any) => (
                  <tr key={msg.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3 text-gray-600 text-xs">{formatDateUK(msg.sent_at)}</td>
                    <td className="px-6 py-3 text-gray-900 font-medium">
                      {msg.customers?.first_name} {msg.customers?.last_name}
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {msg.channel}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-600 font-mono text-xs">{msg.recipient}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(msg.status)}`}>
                        {msg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Mail className="w-12 h-12" />}
            title="No messages sent yet"
            description="Messages will appear here once reminders start going out."
          />
        )}
      </Card>
    </div>
  )
}
