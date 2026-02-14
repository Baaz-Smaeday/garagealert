import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatUKPhone, renderTemplate } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { customerId, channel, subject, body, templateTokens } = await request.json()

  const { data: customer } = await supabase
    .from('customers').select('*').eq('id', customerId).single()
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const { data: garage } = await supabase
    .from('garages').select('*').eq('user_id', user.id).single()

  const renderedBody = renderTemplate(body, { ...customer, ...garage, ...templateTokens })

  let result: any = { success: false, error: 'Unknown channel' }

  try {
    if (channel === 'sms') {
      const { sendSMS } = await import('@/lib/messaging/twilio')
      result = await sendSMS(formatUKPhone(customer.phone), renderedBody)
    } else if (channel === 'whatsapp') {
      const { sendWhatsApp } = await import('@/lib/messaging/twilio')
      result = await sendWhatsApp(formatUKPhone(customer.phone), renderedBody)
    } else if (channel === 'email') {
      const { sendEmail } = await import('@/lib/messaging/postmark')
      result = await sendEmail(customer.email, subject || 'Reminder', renderedBody, garage?.name || '')
    }
  } catch (error: any) {
    result = { success: false, error: error.message }
  }

  await supabase.from('message_logs').insert({
    garage_id: garage?.id,
    customer_id: customerId,
    channel,
    content: renderedBody,
    status: result.success ? 'delivered' : 'failed',
    external_id: result.sid || result.messageId || null,
  })

  return NextResponse.json(result)
}
