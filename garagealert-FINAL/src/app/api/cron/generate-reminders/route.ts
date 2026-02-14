import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { addDays, format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin()
  // Verify request is from Vercel Cron or has correct secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  const { data: garages } = await supabaseAdmin
    .from('garages')
    .select('id')
    .in('subscription_status', ['trialing', 'active'])

  if (!garages || garages.length === 0) {
    return NextResponse.json({ message: 'No active garages', date: todayStr })
  }

  let remindersCreated = 0

  for (const garage of garages) {
    const { data: schedules } = await supabaseAdmin
      .from('reminder_schedules')
      .select('*')
      .eq('garage_id', garage.id)
      .eq('is_enabled', true)

    if (!schedules) continue

    for (const schedule of schedules) {
      const targetDueDate = format(addDays(today, schedule.days_before), 'yyyy-MM-dd')

      const dateColumn: Record<string, string> = {
        mot: 'mot_due_date',
        service: 'next_service_date',
        tyre: 'tyre_check_due_date',
        repair: 'repair_followup_date',
      }

      const enabledColumn: Record<string, string> = {
        mot: 'mot_reminder_enabled',
        service: 'service_reminder_enabled',
        tyre: 'tyre_reminder_enabled',
        repair: 'repair_reminder_enabled',
      }

      const col = dateColumn[schedule.reminder_type]
      const enabledCol = enabledColumn[schedule.reminder_type]
      if (!col) continue

      const { data: vehicles } = await supabaseAdmin
        .from('vehicles')
        .select('*, customers!inner(*)')
        .eq('garage_id', garage.id)
        .eq(col, targetDueDate)
        .eq(enabledCol, true)

      if (!vehicles) continue

      for (const vehicle of vehicles) {
        const customer = (vehicle as any).customers

        // Check consent
        const { data: consent } = await supabaseAdmin
          .from('consent_records')
          .select('status')
          .eq('customer_id', customer.id)
          .eq('channel', customer.preferred_channel)
          .order('collected_at', { ascending: false })
          .limit(1)

        if (consent && consent.length > 0 && consent[0].status === 'opted_out') {
          continue
        }

        // Find template
        const { data: templates } = await supabaseAdmin
          .from('message_templates')
          .select('id')
          .eq('garage_id', garage.id)
          .eq('reminder_type', schedule.reminder_type)
          .eq('channel', customer.preferred_channel)
          .limit(1)

        // Insert (unique constraint prevents duplicates)
        const { error } = await supabaseAdmin
          .from('scheduled_reminders')
          .insert({
            garage_id: garage.id,
            customer_id: customer.id,
            vehicle_id: vehicle.id,
            reminder_type: schedule.reminder_type,
            channel: customer.preferred_channel,
            template_id: templates?.[0]?.id || null,
            scheduled_for: todayStr,
            days_before_due: schedule.days_before,
            status: 'pending',
          })

        if (!error) remindersCreated++
      }
    }
  }

  return NextResponse.json({
    message: `Generated ${remindersCreated} reminders`,
    date: todayStr,
  })
}
