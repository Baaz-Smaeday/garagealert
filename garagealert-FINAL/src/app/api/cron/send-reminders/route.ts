import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendSMS, sendWhatsApp } from '@/lib/messaging/twilio'
import { sendEmail } from '@/lib/messaging/postmark'
import { formatUKPhone, renderTemplate } from '@/lib/utils'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: reminders } = await supabaseAdmin
    .from('scheduled_reminders')
    .select(`*, garages(*), customers(*), vehicles(*), message_templates(*)`)
    .eq('scheduled_for', today)
    .eq('status', 'pending')
    .limit(500)

  if (!reminders || reminders.length === 0) {
    return NextResponse.json({ message: 'No reminders to send', date: today })
  }

  let sent = 0
  let failed = 0

  for (const reminder of reminders) {
    const garage = (reminder as any).garages
    const customer = (reminder as any).customers
    const vehicle = (reminder as any).vehicles
    const template = (reminder as any).message_templates

    if (!template || !customer || !garage) {
      await supabaseAdmin
        .from('scheduled_reminders')
        .update({ status: 'failed', error_message: 'Missing data' })
        .eq('id', reminder.id)
      failed++
      continue
    }

    const dueDateMap: Record<string, string> = {
      mot: vehicle.mot_due_date,
      service: vehicle.next_service_date,
      tyre: vehicle.tyre_check_due_date,
      repair: vehicle.repair_followup_date,
    }

    const tokenData = {
      first_name: customer.first_name,
      last_name: customer.last_name,
      vehicle_reg: vehicle.registration,
      due_date: dueDateMap[reminder.reminder_type] || '',
      garage_name: garage.name,
      garage_phone: garage.phone || '',
      unsubscribe_link: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${customer.id}`,
    }

    const renderedBody = renderTemplate(template.body, tokenData)
    const renderedSubject = template.subject ? renderTemplate(template.subject, tokenData) : undefined

    let result: { success: boolean; sid?: string; messageId?: string; error?: string }

    try {
      switch (reminder.channel) {
        case 'sms':
          result = await sendSMS(formatUKPhone(customer.phone), renderedBody)
          break
        case 'whatsapp':
          result = await sendWhatsApp(formatUKPhone(customer.phone), renderedBody)
          break
        case 'email':
          result = await sendEmail(customer.email, renderedSubject || `Reminder from ${garage.name}`, renderedBody, garage.name)
          break
        default:
          result = { success: false, error: 'Unknown channel' }
      }

      await supabaseAdmin
        .from('scheduled_reminders')
        .update({
          status: result.success ? 'sent' : 'failed',
          sent_at: result.success ? new Date().toISOString() : null,
          error_message: result.error || null,
        })
        .eq('id', reminder.id)

      await supabaseAdmin.from('message_logs').insert({
        garage_id: garage.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        scheduled_reminder_id: reminder.id,
        channel: reminder.channel,
        recipient: reminder.channel === 'email' ? customer.email : customer.phone,
        template_id: template.id,
        subject: renderedSubject,
        body: renderedBody,
        status: result.success ? 'delivered' : 'failed',
        provider_message_id: result.sid || result.messageId || null,
        error_message: result.error || null,
      })

      result.success ? sent++ : failed++
    } catch (error: any) {
      await supabaseAdmin
        .from('scheduled_reminders')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', reminder.id)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: reminders.length, date: today })
}
