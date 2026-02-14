import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS, sendWhatsApp } from '@/lib/messaging/twilio'
import { sendEmail } from '@/lib/messaging/postmark'
import { formatUKPhone, renderTemplate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { customerId, vehicleId, channel, templateId } = await request.json()

  const { data: garage } = await supabase
    .from('garages').select('*').eq('user_id', user.id).single()
  if (!garage) return NextResponse.json({ error: 'Garage not found' }, { status: 404 })

  const { data: customer } = await supabase
    .from('customers').select('*').eq('id', customerId).eq('garage_id', garage.id).single()
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const { data: vehicle } = await supabase
    .from('vehicles').select('*').eq('id', vehicleId).single()

  const { data: template } = await supabase
    .from('message_templates').select('*').eq('id', templateId).single()
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const tokenData = {
    first_name: customer.first_name,
    last_name: customer.last_name,
    vehicle_reg: vehicle?.registration || '',
    due_date: vehicle?.mot_due_date || '',
    garage_name: garage.name,
    garage_phone: garage.phone || '',
    unsubscribe_link: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe/${customer.id}`,
  }

  const body = renderTemplate(template.body, tokenData)
  const subject = template.subject ? renderTemplate(template.subject, tokenData) : `Message from ${garage.name}`

  let result: any
  switch (channel) {
    case 'sms':
      result = await sendSMS(formatUKPhone(customer.phone!), body)
      break
    case 'whatsapp':
      result = await sendWhatsApp(formatUKPhone(customer.phone!), body)
      break
    case 'email':
      result = await sendEmail(customer.email!, subject, body, garage.name)
      break
    default:
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
  }

  await supabase.from('message_logs').insert({
    garage_id: garage.id,
    customer_id: customer.id,
    vehicle_id: vehicleId,
    channel,
    recipient: channel === 'email' ? customer.email : customer.phone,
    template_id: templateId,
    subject: channel === 'email' ? subject : null,
    body,
    status: result.success ? 'delivered' : 'failed',
    provider_message_id: result.sid || result.messageId || null,
    error_message: result.error || null,
  })

  return result.success
    ? NextResponse.json({ success: true })
    : NextResponse.json({ error: result.error }, { status: 500 })
}
