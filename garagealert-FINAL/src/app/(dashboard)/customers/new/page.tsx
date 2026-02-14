import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/ui/Card'
import { CustomerForm } from '@/components/CustomerForm'

export default async function NewCustomerPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!garage) redirect('/login')

  return (
    <div>
      <PageHeader title="Add New Customer" description="Add a customer and their vehicle details." />
      <CustomerForm garageId={garage.id} />
    </div>
  )
}
