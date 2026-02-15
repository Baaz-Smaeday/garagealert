import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendEmail(to, subject, body, fromName, fromEmail) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromName + ' <' + fromEmail + '>', to: [to], subject: subject, text: body }),
  })
  if (!res.ok) throw new Error('Resend error: ' + await res.text())
  return await res.json()
}

function fillTemplate(text, data) {
  let result = text
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp('\\{' + key + '\\}', 'g'), value || '')
  }
  return result
}

function formatDateUK(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== 'Bearer ' + process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const today = new Date()
  const results = []

  try {
    const { data: garages } = await supabase.from('garages').select('id, name, phone, email')
    if (!garages || garages.length === 0) {
      return NextResponse.json({ message: 'No garages found', processed: 0 })
    }

    for (const garage of garages) {
      const { data: schedules } = await supabase
        .from('reminder_schedules').select('*').eq('garage_id', garage.id)

      if (!schedules || schedules.length === 0) continue

      for (const schedule of schedules) {
        const targetDate = new Date(today)
        targetDate.setDate(targetDate.getDate() + schedule.days_before)
        const targetDateStr = targetDate.toISOString().split('T')[0]

        let dateColumn = ''
        if (schedule.reminder_type === 'mot') dateColumn = 'mot_due_date'
        else if (schedule.reminder_type === 'service') dateColumn = 'next_service_date'
        else continue

        const reminderFlag = schedule.reminder_type + '_reminder_enabled'

        const { data: vehicles } = await supabase
          .from('vehicles')
          .select('*, customers(id, first_name, last_name, email, phone, preferred_channel)')
          .eq('garage_id', garage.id)
          .eq(dateColumn, targetDateStr)
          .eq(reminderFlag, true)

        if (!vehicles || vehicles.length === 0) continue

        const { data: template } = await supabase
          .from('message_templates')
          .select('*')
          .eq('garage_id', garage.id)
          .eq('reminder_type', schedule.reminder_type)
          .eq('channel', 'email')
          .ilike('name', '%' + schedule.days_before + ' day%')
          .limit(1)
          .single()

        if (!template) continue

        for (const vehicle of vehicles) {
          const customer = vehicle.customers
          if (!customer || !customer.email) continue

          const { data: existing } = await supabase
            .from('scheduled_reminders').select('id')
            .eq('vehicle_id', vehicle.id)
            .eq('reminder_type', schedule.reminder_type)
            .eq('scheduled_for', targetDateStr)
            .limit(1)

          if (existing && existing.length > 0) continue

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://garagealert.vercel.app'
          const templateData = {
            first_name: customer.first_name,
            last_name: customer.last_name,
            vehicle_reg: vehicle.registration,
            due_date: formatDateUK(targetDateStr),
            garage_name: garage.name || 'Your Garage',
            garage_phone: garage.phone || '',
            unsubscribe_link: appUrl + '/unsubscribe/' + customer.id,
          }

          const subject = fillTemplate(template.subject || '', templateData)
          const body = fillTemplate(template.body || '', templateData)

          const { data: reminder } = await supabase
            .from('scheduled_reminders')
            .insert({
              garage_id: garage.id,
              customer_id: customer.id,
              vehicle_id: vehicle.id,
              reminder_type: schedule.reminder_type,
              channel: 'email',
              scheduled_for: targetDateStr,
              status: 'sending',
            })
            .select('id').single()

          try {
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
            await sendEmail(customer.email, subject, body, garage.name || 'GarageAlert', fromEmail)

            if (reminder) {
              await supabase.from('scheduled_reminders').update({ status: 'sent' }).eq('id', reminder.id)
            }
            await supabase.from('message_logs').insert({
              garage_id: garage.id, customer_id: customer.id, vehicle_id: vehicle.id,
              channel: 'email', message_type: schedule.reminder_type, status: 'delivered', sent_at: new Date().toISOString(),
            })
            results.push({ customer: customer.first_name + ' ' + customer.last_name, vehicle: vehicle.registration, type: schedule.reminder_type, days_before: schedule.days_before, status: 'sent' })
          } catch (emailError) {
            if (reminder) {
              await supabase.from('scheduled_reminders').update({ status: 'failed' }).eq('id', reminder.id)
            }
            results.push({ customer: customer.first_name + ' ' + customer.last_name, vehicle: vehicle.registration, status: 'failed', error: emailError.message })
          }
        }
      }
    }

    return NextResponse.json({ message: 'Cron job completed', processed: results.length, results, timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ error: 'Cron job failed', details: error.message }, { status: 500 })
  }
}
