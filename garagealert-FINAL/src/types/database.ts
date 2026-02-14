// ============================================
// Database types — matches the Supabase tables
// ============================================

export interface Garage {
  id: string
  user_id: string
  name: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  phone: string | null
  email: string | null
  website: string | null
  logo_url: string | null
  default_sms_enabled: boolean
  default_whatsapp_enabled: boolean
  default_email_enabled: boolean
  stripe_customer_id: string | null
  subscription_status: 'trialing' | 'active' | 'cancelled' | 'past_due'
  subscription_plan: 'starter' | 'growth' | 'pro' | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  garage_id: string
  first_name: string
  last_name: string
  phone: string | null
  email: string | null
  preferred_channel: 'sms' | 'whatsapp' | 'email'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  customer_id: string
  garage_id: string
  registration: string
  make: string | null
  model: string | null
  colour: string | null
  year: number | null
  mileage: number | null
  mot_due_date: string | null
  last_service_date: string | null
  next_service_date: string | null
  tyre_check_due_date: string | null
  repair_followup_date: string | null
  repair_followup_notes: string | null
  mot_reminder_enabled: boolean
  service_reminder_enabled: boolean
  tyre_reminder_enabled: boolean
  repair_reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ConsentRecord {
  id: string
  customer_id: string
  channel: 'sms' | 'whatsapp' | 'email'
  status: 'opted_in' | 'opted_out'
  method: string | null
  collected_at: string
  ip_address: string | null
  notes: string | null
}

export interface ReminderSchedule {
  id: string
  garage_id: string
  reminder_type: 'mot' | 'service' | 'tyre' | 'repair'
  days_before: number
  is_enabled: boolean
  created_at: string
}

export interface MessageTemplate {
  id: string
  garage_id: string
  reminder_type: 'mot' | 'service' | 'tyre' | 'repair' | 'ad_hoc'
  channel: 'sms' | 'whatsapp' | 'email'
  name: string
  subject: string | null
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface ScheduledReminder {
  id: string
  garage_id: string
  customer_id: string
  vehicle_id: string
  reminder_type: 'mot' | 'service' | 'tyre' | 'repair'
  channel: 'sms' | 'whatsapp' | 'email'
  template_id: string | null
  scheduled_for: string
  days_before_due: number | null
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'cancelled'
  sent_at: string | null
  error_message: string | null
  created_at: string
}

export interface MessageLog {
  id: string
  garage_id: string
  customer_id: string | null
  vehicle_id: string | null
  scheduled_reminder_id: string | null
  channel: 'sms' | 'whatsapp' | 'email'
  recipient: string
  template_id: string | null
  subject: string | null
  body: string
  status: 'pending' | 'delivered' | 'failed' | 'bounced'
  provider_message_id: string | null
  cost_pence: number | null
  error_message: string | null
  sent_at: string
  delivered_at: string | null
}

export interface AuditLog {
  id: string
  garage_id: string | null
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  details: Record<string, any> | null
  ip_address: string | null
  created_at: string
}

// ============================================
// Helper types for joins
// ============================================

export interface CustomerWithVehicles extends Customer {
  vehicles: Vehicle[]
}

export interface VehicleWithCustomer extends Vehicle {
  customers: Customer
}

export interface MessageLogWithCustomer extends MessageLog {
  customers: Pick<Customer, 'first_name' | 'last_name'> | null
}
