import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatCard } from '@/components/StatCard'
import { Card, CardHeader, CardContent, PageHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Car, Bell, Mail, Plus } from 'lucide-react'
import { formatDateUK, getStatusColor } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get garage
  const { data: garage } = await supabase
    .from('garages')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!garage) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to GarageAlert!</h2>
        <p className="text-gray-500">Your account is being set up. Please refresh the page in a moment.</p>
      </div>
    )
  }

  // Get counts
  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garage.id)

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garage.id)

  const { count: pendingReminders } = await supabase
    .from('scheduled_reminders')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garage.id)
    .eq('status', 'pending')

  const { count: messagesSent } = await supabase
    .from('message_logs')
    .select('*', { count: 'exact', head: true })
    .eq('garage_id', garage.id)

  // Get recent messages
  const { data: recentMessages } = await supabase
    .from('message_logs')
    .select('*, customers(first_name, last_name)')
    .eq('garage_id', garage.id)
    .order('sent_at', { ascending: false })
    .limit(10)

  // Get upcoming vehicles (MOT due within 30 days)
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: upcomingVehicles } = await supabase
    .from('vehicles')
    .select('*, customers(first_name, last_name)')
    .eq('garage_id', garage.id)
    .gte('mot_due_date', today)
    .lte('mot_due_date', thirtyDaysFromNow)
    .order('mot_due_date', { ascending: true })
    .limit(5)

  // Trial info
  const trialDaysLeft = garage.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(garage.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div>
      {/* Trial banner */}
      {garage.subscription_status === 'trialing' && trialDaysLeft > 0 && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm text-brand-800">
            <strong>{trialDaysLeft} days</strong> left in your free trial.
          </p>
          <Link href="/settings/billing">
            <Button size="sm">Choose a plan</Button>
          </Link>
        </div>
      )}

      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${garage.name || 'there'}`}
        description={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        action={
          <Link href="/customers/new">
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Customer
            </Button>
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Customers" value={customerCount || 0} icon={Users} />
        <StatCard title="Vehicles" value={vehicleCount || 0} icon={Car} />
        <StatCard title="Pending Reminders" value={pendingReminders || 0} icon={Bell} />
        <StatCard title="Messages Sent" value={messagesSent || 0} icon={Mail} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MOTs due soon */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">MOTs Due Soon</h2>
              <Link href="/vehicles" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {upcomingVehicles && upcomingVehicles.length > 0 ? (
              upcomingVehicles.map((v: any) => (
                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {v.registration}
                      <span className="text-gray-400 font-normal ml-2">
                        {v.make} {v.model}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {v.customers?.first_name} {v.customers?.last_name}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-amber-600">
                    {formatDateUK(v.mot_due_date)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No MOTs due in the next 30 days.
              </div>
            )}
          </div>
        </Card>

        {/* Recent messages */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Messages</h2>
              <Link href="/messages" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-50">
            {recentMessages && recentMessages.length > 0 ? (
              recentMessages.slice(0, 5).map((msg: any) => (
                <div key={msg.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {msg.customers?.first_name} {msg.customers?.last_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{msg.channel}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(msg.status)}`}>
                    {msg.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">
                No messages sent yet. Add customers and vehicles to get started.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
