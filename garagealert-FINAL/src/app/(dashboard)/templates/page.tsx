import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardHeader, CardContent, PageHeader, EmptyState } from '@/components/ui/Card'
import { FileText } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: garage } = await supabase
    .from('garages').select('id').eq('user_id', user.id).single()
  if (!garage) redirect('/login')

  const { data: templates } = await supabase
    .from('message_templates')
    .select('*')
    .eq('garage_id', garage.id)
    .order('reminder_type', { ascending: true })

  const groupedTemplates = templates?.reduce((acc: any, t: any) => {
    const key = t.reminder_type
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {}) || {}

  const typeLabels: Record<string, string> = {
    mot: 'MOT Reminders',
    service: 'Service Reminders',
    tyre: 'Tyre Check Reminders',
    repair: 'Repair Follow-Up',
    ad_hoc: 'Ad-Hoc Messages',
  }

  return (
    <div>
      <PageHeader
        title="Message Templates"
        description="Customise the messages sent to your customers"
      />

      {/* Token reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-sm text-blue-800 font-medium mb-1">Available tokens:</p>
        <p className="text-xs text-blue-700 font-mono">
          {'{first_name}'} · {'{last_name}'} · {'{vehicle_reg}'} · {'{due_date}'} · {'{garage_name}'} · {'{garage_phone}'} · {'{unsubscribe_link}'}
        </p>
      </div>

      {templates && templates.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([type, temps]: [string, any]) => (
            <Card key={type}>
              <CardHeader>
                <h2 className="text-base font-semibold text-gray-900">{typeLabels[type] || type}</h2>
              </CardHeader>
              <div className="divide-y divide-gray-100">
                {temps.map((t: any) => (
                  <div key={t.id} className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">{t.name}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {t.channel}
                      </span>
                    </div>
                    {t.subject && (
                      <p className="text-xs text-gray-500 mb-1">Subject: {t.subject}</p>
                    )}
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 text-xs">
                      {t.body}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title="No templates yet"
            description="Default templates will be created when you first set up your reminders. You can also create custom templates."
          />
        </Card>
      )}
    </div>
  )
}
