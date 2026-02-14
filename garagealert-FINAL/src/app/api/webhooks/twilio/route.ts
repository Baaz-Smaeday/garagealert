import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  const formData = await request.formData()
  const from = formData.get('From') as string
  const body = (formData.get('Body') as string || '').trim().toUpperCase()

  if (['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT'].includes(body)) {
    const isWhatsApp = from.startsWith('whatsapp:')
    const phoneNumber = from.replace('whatsapp:', '')
    const channel = isWhatsApp ? 'whatsapp' : 'sms'

    const { data: customers } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('phone', phoneNumber)

    if (customers) {
      for (const customer of customers) {
        await supabaseAdmin.from('consent_records').insert({
          customer_id: customer.id,
          channel,
          status: 'opted_out',
          method: 'stop_keyword',
        })
      }
    }
  }

  return new NextResponse(
    '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
