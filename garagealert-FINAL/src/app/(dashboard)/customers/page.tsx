import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Plus, Users, Search } from 'lucide-react'
import { formatDateUK } from '@/lib/utils'
import Link from 'next/link'

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!garage) redirect('/login')

  const { data: customers } = await supabase
    .from('customers')
    .select('*, vehicles(count)')
    .eq('garage_id', garage.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${customers?.length || 0} customers in your database`}
        action={
          <Link href="/customers/new">
            <Button>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Customer
            </Button>
          </Link>
        }
      />

      <Card>
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Name</th>
                  <th className="px-6 py-3 text-left font-medium">Phone</th>
                  <th className="px-6 py-3 text-left font-medium">Email</th>
                  <th className="px-6 py-3 text-left font-medium">Channel</th>
                  <th className="px-6 py-3 text-left font-medium">Vehicles</th>
                  <th className="px-6 py-3 text-left font-medium">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer: any) => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-brand-600"
                      >
                        {customer.first_name} {customer.last_name}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">{customer.phone || '—'}</td>
                    <td className="px-6 py-3.5 text-gray-600">{customer.email || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {customer.preferred_channel}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-gray-600">
                      {customer.vehicles?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {formatDateUK(customer.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Users className="w-12 h-12" />}
            title="No customers yet"
            description="Add your first customer to start sending reminders."
            action={
              <Link href="/customers/new">
                <Button>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Customer
                </Button>
              </Link>
            }
          />
        )}
      </Card>
    </div>
  )
}
